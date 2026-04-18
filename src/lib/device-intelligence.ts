// src/lib/device-intelligence.ts
// SSR-safe — all browser API access is guarded

export const CLOUD_PROVIDER = 'groq' as const;
export type CloudProvider = typeof CLOUD_PROVIDER;

// ─── Thresholds (named constants — no magic numbers) ──────────────────
const MEMORY_LOW_GB = 4;          // Below this: avoid heavy WASM
const MEMORY_HIGH_GB = 8;         // Above this: full local execution
const CONCURRENCY_MIN = 4;        // Below this: UI thread risk on mobile
const INFERENCE_TIMEOUT_MS = 10_000;  // WASM model init timeout
const INFERENCE_STALL_MS = 15_000;    // Per-inference timeout
const FALLBACK_RETRY_MAX = 3;     // Stability monitor max retries

export { MEMORY_LOW_GB, MEMORY_HIGH_GB, CONCURRENCY_MIN, INFERENCE_TIMEOUT_MS, INFERENCE_STALL_MS, FALLBACK_RETRY_MAX };

// ─── Types ────────────────────────────────────────────────────────────
export interface DeviceCapability {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasWebGPU: boolean;
  hasWebAssembly: boolean;
  deviceMemoryGb: number | undefined;
  hardwareConcurrency: number | undefined;
  effectiveConnectionType: string | undefined;
  saveData: boolean;
  score: number;          // 0-100, higher = more capable
  riskLevel: 'low' | 'medium' | 'high';
}

export type ExecutionMode = 'local' | 'cloud' | 'hybrid' | 'simulated';

export interface RoutingStrategy {
  mode: ExecutionMode;
  reason: string;
  badges: string[];
  mobileOptimized: boolean;
  canAttemptLocal: boolean;
  shouldFallbackToCloud: boolean;
  cloudProvider: CloudProvider;
}

export type DemoExecutionProfile =
  | 'light-local'       // Small models, fast init — prefer local always
  | 'heavy-local'       // Large WASM/WebGPU — local on capable, cloud on constrained
  | 'cloud-preferred'   // Designed for cloud; local is optional bonus
  | 'hybrid';           // Equal quality either way; choose by device

// ─── Detection ────────────────────────────────────────────────────────
export function getDeviceCapability(): DeviceCapability {
  // SSR guard — return conservative defaults during server rendering
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false, isIOS: false, isAndroid: false,
      hasWebGPU: false, hasWebAssembly: false,
      deviceMemoryGb: undefined, hardwareConcurrency: undefined,
      effectiveConnectionType: undefined, saveData: false,
      score: 50, riskLevel: 'medium',
    };
  }

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid ||
    // Platform API hint as secondary signal (more reliable than UA on modern devices)
    ('userAgentData' in navigator &&
      (navigator as Navigator & { userAgentData?: { mobile?: boolean } })
        .userAgentData?.mobile === true);

  const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
  const hasWebAssembly = typeof WebAssembly !== 'undefined';

  const conn = (navigator as Navigator & {
    connection?: { effectiveType?: string; downlink?: number; saveData?: boolean }
  }).connection;
  const effectiveConnectionType = conn?.effectiveType;
  const saveData = conn?.saveData ?? false;

  const deviceMemoryGb =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency;

  // ─── Scoring (0–100) ────────────────────────────────────────────────
  // Each dimension contributes independently; we sum and clamp.
  let score = 50; // baseline

  // WebAssembly is table stakes for any local inference
  if (!hasWebAssembly) score -= 40;

  // WebGPU gives significant uplift for GPU-accelerated models
  if (hasWebGPU) score += 20;

  // RAM is the most reliable indicator of WASM capability
  if (deviceMemoryGb !== undefined) {
    if (deviceMemoryGb >= MEMORY_HIGH_GB) score += 20;
    else if (deviceMemoryGb >= MEMORY_LOW_GB) score += 5;
    else score -= 25; // Low RAM: high crash risk for heavy WASM
  }

  // Thread count indicates CPU capability
  if (hardwareConcurrency !== undefined) {
    if (hardwareConcurrency >= CONCURRENCY_MIN) score += 10;
    else score -= 10;
  }

  // Mobile penalty: thermal throttling and blob: worker restrictions
  if (isMobile) score -= 15;

  // iOS-specific penalty: Safari's blob: URL worker restriction
  // breaks Transformers.js worker bootstrap entirely
  if (isIOS) score -= 20;

  // Data saver mode suggests constrained connection and possibly battery saving
  if (saveData) score -= 10;

  // Slow connection doesn't affect local inference but cloud quality
  if (effectiveConnectionType === '2g' || effectiveConnectionType === 'slow-2g') {
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  const riskLevel: DeviceCapability['riskLevel'] =
    score >= 65 ? 'low' : score >= 40 ? 'medium' : 'high';

  return {
    isMobile, isIOS, isAndroid, hasWebGPU, hasWebAssembly,
    deviceMemoryGb, hardwareConcurrency,
    effectiveConnectionType, saveData,
    score, riskLevel,
  };
}

// ─── Routing ──────────────────────────────────────────────────────────
export function getRoutingStrategy(
  demoId: string,
  profile: DemoExecutionProfile,
  capability: DeviceCapability,
  hasCloudFallback: boolean,
): RoutingStrategy {
  const badges: string[] = [];
  let mode: ExecutionMode;
  let reason: string;
  let canAttemptLocal = false;
  let shouldFallbackToCloud = false;

  // Suppress unused variable warning — demoId reserved for future per-demo overrides
  void demoId;

  // iOS Safari: blob: URL restriction prevents Transformers.js worker init.
  // This is a hard constraint — local execution will always fail on iOS
  // regardless of device capability.
  if (capability.isIOS && (profile === 'heavy-local' || profile === 'hybrid')) {
    mode = hasCloudFallback ? 'cloud' : 'simulated';
    reason = 'iOS Safari restricts Web Worker blob: URLs required for WASM inference';
    badges.push(hasCloudFallback ? 'Cloud AI active' : 'Simulated demo');
    shouldFallbackToCloud = hasCloudFallback;
  }

  // light-local demos are small enough to run on most mobile devices
  else if (profile === 'light-local') {
    canAttemptLocal = capability.hasWebAssembly;
    mode = canAttemptLocal ? 'local' : (hasCloudFallback ? 'cloud' : 'simulated');
    reason = canAttemptLocal
      ? 'Lightweight model — running on-device'
      : 'WebAssembly unavailable';
    badges.push(canAttemptLocal ? 'On-device AI' : 'Cloud AI');
  }

  // cloud-preferred: server-side demos that always work regardless of device
  else if (profile === 'cloud-preferred') {
    mode = 'cloud';
    canAttemptLocal = false;
    reason = 'Demo designed for cloud execution';
    badges.push('Cloud AI');
    shouldFallbackToCloud = true;
  }

  // heavy-local / hybrid: score-gated decision
  else {
    if (capability.score >= 65) {
      // High-capability device — attempt local
      canAttemptLocal = true;
      mode = 'local';
      reason = `Device score ${capability.score}/100 — local execution capable`;
      badges.push('On-device AI');
    } else if (capability.score >= 40 && hasCloudFallback) {
      // Medium capability — hybrid: try local, fall back to cloud on failure
      canAttemptLocal = true;
      mode = 'hybrid';
      reason = `Device score ${capability.score}/100 — hybrid mode with cloud fallback`;
      badges.push('Hybrid mode');
      shouldFallbackToCloud = true;
    } else {
      // Low capability — go straight to cloud or simulated
      mode = hasCloudFallback ? 'cloud' : 'simulated';
      reason = `Device score ${capability.score}/100 — routing to ${hasCloudFallback ? 'cloud' : 'simulated'} for stability`;
      badges.push(hasCloudFallback ? 'Cloud AI active' : 'Simulated demo');
      shouldFallbackToCloud = hasCloudFallback;
    }
  }

  return {
    mode, reason, badges,
    mobileOptimized: capability.isMobile,
    canAttemptLocal,
    shouldFallbackToCloud,
    cloudProvider: CLOUD_PROVIDER,
  };
}
