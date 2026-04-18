import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getDeviceCapability, getRoutingStrategy,
  MEMORY_LOW_GB, MEMORY_HIGH_GB,
} from '@/lib/device-intelligence';

// SSR environment (no window)
describe('getDeviceCapability — SSR', () => {
  it('returns safe defaults when window is undefined', () => {
    const original = global.window;
    // @ts-expect-error intentional SSR simulation
    delete global.window;
    const cap = getDeviceCapability();
    expect(cap.score).toBe(50);
    expect(cap.riskLevel).toBe('medium');
    expect(cap.isMobile).toBe(false);
    expect(cap.isIOS).toBe(false);
    // Restore
    global.window = original;
  });
});

describe('getDeviceCapability — client', () => {
  const mockNav = (overrides: Record<string, unknown>) => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120',
      hardwareConcurrency: 8,
      ...overrides,
    });
    vi.stubGlobal('WebAssembly', {});
  };

  afterEach(() => vi.unstubAllGlobals());

  it('scores high for capable desktop', () => {
    mockNav({ deviceMemory: 16, gpu: {} });
    const cap = getDeviceCapability();
    expect(cap.score).toBeGreaterThanOrEqual(65);
    expect(cap.riskLevel).toBe('low');
  });

  it('scores low for iOS', () => {
    mockNav({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      deviceMemory: 6,
    });
    const cap = getDeviceCapability();
    expect(cap.isIOS).toBe(true);
    expect(cap.isMobile).toBe(true);
    expect(cap.score).toBeLessThan(65);
  });

  it('scores low for 2GB Android device', () => {
    mockNav({
      userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-A125F)',
      deviceMemory: 2,
    });
    const cap = getDeviceCapability();
    expect(cap.isAndroid).toBe(true);
    expect(cap.score).toBeLessThan(40);
    expect(cap.riskLevel).toBe('high');
  });

  it('penalises save-data mode', () => {
    mockNav({
      deviceMemory: 16,
      connection: { effectiveType: '4g', saveData: true },
    });
    const withSaveData = getDeviceCapability();
    mockNav({
      deviceMemory: 16,
      connection: { effectiveType: '4g', saveData: false },
    });
    const withoutSaveData = getDeviceCapability();
    expect(withSaveData.score).toBeLessThan(withoutSaveData.score);
  });

  it('penalises 2g connection', () => {
    mockNav({
      deviceMemory: 16,
      connection: { effectiveType: '2g', saveData: false },
    });
    const with2g = getDeviceCapability();
    mockNav({
      deviceMemory: 16,
      connection: { effectiveType: '4g', saveData: false },
    });
    const with4g = getDeviceCapability();
    expect(with2g.score).toBeLessThan(with4g.score);
  });

  it('correctly uses MEMORY_LOW_GB and MEMORY_HIGH_GB thresholds', () => {
    // At MEMORY_HIGH_GB should get +20
    mockNav({ deviceMemory: MEMORY_HIGH_GB });
    const high = getDeviceCapability();
    // At MEMORY_LOW_GB should get +5
    mockNav({ deviceMemory: MEMORY_LOW_GB });
    const low = getDeviceCapability();
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('clamps score between 0 and 100', () => {
    // Worst case: no WASM, mobile, iOS, low concurrency
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      hardwareConcurrency: 2,
      deviceMemory: 1,
    });
    vi.stubGlobal('WebAssembly', undefined);
    const cap = getDeviceCapability();
    expect(cap.score).toBeGreaterThanOrEqual(0);
    expect(cap.score).toBeLessThanOrEqual(100);
  });

  it('returns hasWebAssembly=false when WebAssembly is not defined', () => {
    mockNav({});
    vi.stubGlobal('WebAssembly', undefined);
    const cap = getDeviceCapability();
    expect(cap.hasWebAssembly).toBe(false);
  });
});

describe('getRoutingStrategy', () => {
  const lowCap = {
    isMobile: true, isIOS: true, isAndroid: false,
    hasWebGPU: false, hasWebAssembly: true, deviceMemoryGb: 4,
    hardwareConcurrency: 4, effectiveConnectionType: '4g',
    saveData: false, score: 25, riskLevel: 'high' as const,
  };

  const highCap = {
    isMobile: false, isIOS: false, isAndroid: false,
    hasWebGPU: true, hasWebAssembly: true, deviceMemoryGb: 16,
    hardwareConcurrency: 16, effectiveConnectionType: '4g',
    saveData: false, score: 90, riskLevel: 'low' as const,
  };

  const midCap = {
    ...highCap, score: 50, riskLevel: 'medium' as const,
    hasWebGPU: false, deviceMemoryGb: 4,
  };

  it('routes iOS heavy-local to cloud when fallback available', () => {
    const s = getRoutingStrategy('rag', 'heavy-local', lowCap, true);
    expect(s.mode).toBe('cloud');
    expect(s.canAttemptLocal).toBe(false);
  });

  it('routes iOS heavy-local to simulated when no fallback', () => {
    const s = getRoutingStrategy('multimodal', 'heavy-local', lowCap, false);
    expect(s.mode).toBe('simulated');
    expect(s.canAttemptLocal).toBe(false);
  });

  it('routes capable desktop heavy-local to local', () => {
    const s = getRoutingStrategy('rag', 'heavy-local', highCap, true);
    expect(s.mode).toBe('local');
    expect(s.canAttemptLocal).toBe(true);
  });

  it('routes medium capability to hybrid when cloud fallback available', () => {
    const s = getRoutingStrategy('rag', 'heavy-local', midCap, true);
    expect(s.mode).toBe('hybrid');
    expect(s.canAttemptLocal).toBe(true);
    expect(s.shouldFallbackToCloud).toBe(true);
  });

  it('routes medium capability to simulated when no cloud fallback', () => {
    const s = getRoutingStrategy('quantization', 'heavy-local', midCap, false);
    expect(s.mode).toBe('simulated');
    expect(s.canAttemptLocal).toBe(false);
  });

  it('routes cloud-preferred demos to cloud always', () => {
    const s = getRoutingStrategy('llm-router', 'cloud-preferred', highCap, true);
    expect(s.mode).toBe('cloud');
    expect(s.canAttemptLocal).toBe(false);
  });

  it('routes light-local demos to local when WASM available', () => {
    const cap = { ...highCap, isMobile: true, isIOS: false };
    const s = getRoutingStrategy('browser-ai', 'light-local', cap, false);
    expect(s.mode).toBe('local');
    expect(s.canAttemptLocal).toBe(true);
  });

  it('routes light-local to simulated when no WASM and no fallback', () => {
    const noWasm = { ...lowCap, isIOS: false, hasWebAssembly: false };
    const s = getRoutingStrategy('browser-ai', 'light-local', noWasm, false);
    expect(s.mode).toBe('simulated');
  });

  it('always includes cloudProvider in strategy', () => {
    const s = getRoutingStrategy('rag', 'cloud-preferred', highCap, true);
    expect(s.cloudProvider).toBe('groq');
  });

  it('marks mobileOptimized when device is mobile', () => {
    const mobile = { ...highCap, isMobile: true };
    const s = getRoutingStrategy('rag', 'cloud-preferred', mobile, true);
    expect(s.mobileOptimized).toBe(true);
  });
});
