'use client';

/**
 * @deprecated Use `useExecutionStrategy` from '@/hooks/useExecutionStrategy' instead.
 * This wrapper is kept for backwards compatibility while tests are migrated.
 */

import { useExecutionStrategy } from '@/hooks/useExecutionStrategy';

export type BrowserAICapability =
  | 'ready'           // Desktop, sufficient RAM, full inference
  | 'low-memory'      // Desktop but low RAM — attempt with warning
  | 'mobile-ios'      // iOS Safari — blob: worker blocked
  | 'mobile-android'  // Android — constrained WASM heap
  | 'no-webgpu'       // Desktop but no WebGPU (affects Multimodal only)
  | 'unsupported';    // No WebAssembly at all

export interface BrowserAIStatus {
  capability: BrowserAICapability | string;
  shouldAttemptLoad: boolean;
  warningTitle: string | null;
  warningDetail: string | null;
  deviceMemoryGB: number | undefined;
  isMobile: boolean;
  hasWebGPU: boolean;
}

/**
 * @deprecated Use `useExecutionStrategy` from '@/hooks/useExecutionStrategy' instead.
 */
export function useBrowserAI(requiresWebGPU = false): BrowserAIStatus {
  const exec = useExecutionStrategy({
    demoId: 'legacy',
    executionProfile: 'heavy-local',
    hasCloudFallback: false,
    requiresWebGPU,
  });
  // Map new shape to old shape for backwards compat
  return {
    capability: exec.mode === 'local' ? 'ready' : (exec.mode ?? 'ready'),
    shouldAttemptLoad: exec.canAttemptLocal,
    warningTitle: exec.strategy?.badges[0] ?? null,
    warningDetail: exec.fallbackReason,
    deviceMemoryGB: exec.capability?.deviceMemoryGb,
    isMobile: exec.capability?.isMobile ?? false,
    hasWebGPU: exec.capability?.hasWebGPU ?? false,
  };
}
