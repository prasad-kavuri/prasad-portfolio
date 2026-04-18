import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetDeviceCapability = vi.hoisted(() => vi.fn());
const mockGetRoutingStrategy = vi.hoisted(() => vi.fn());

vi.mock('@/lib/device-intelligence', () => ({
  getDeviceCapability: mockGetDeviceCapability,
  getRoutingStrategy: mockGetRoutingStrategy,
  INFERENCE_TIMEOUT_MS: 10_000,
  FALLBACK_RETRY_MAX: 3,
}));

import { useExecutionStrategy } from '@/hooks/useExecutionStrategy';

describe('useExecutionStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDeviceCapability.mockReturnValue({
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      hasWebGPU: false,
      hasWebAssembly: true,
      deviceMemoryGb: 8,
      hardwareConcurrency: 8,
      effectiveConnectionType: '4g',
      saveData: false,
      score: 70,
      riskLevel: 'low',
    });
    mockGetRoutingStrategy.mockReturnValue({
      mode: 'hybrid',
      reason: 'mock strategy',
      badges: ['Hybrid mode'],
      mobileOptimized: false,
      canAttemptLocal: true,
      shouldFallbackToCloud: true,
      cloudProvider: 'groq',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses heavy-local routing when WebGPU is required but unavailable', async () => {
    const { result } = renderHook(() =>
      useExecutionStrategy({
        demoId: 'multimodal',
        executionProfile: 'hybrid',
        hasCloudFallback: true,
        requiresWebGPU: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(mockGetRoutingStrategy).toHaveBeenCalledWith(
      'multimodal',
      'heavy-local',
      expect.objectContaining({ hasWebGPU: false }),
      true
    );
    expect(result.current.mode).toBe('hybrid');
    expect(result.current.canAttemptLocal).toBe(true);
  });

  it('triggers fallback and resets recovery state after timeout', async () => {
    const { result } = renderHook(() =>
      useExecutionStrategy({
        demoId: 'quantization',
        executionProfile: 'heavy-local',
        hasCloudFallback: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    vi.useFakeTimers();

    act(() => {
      result.current.triggerFallback('model load timeout');
    });

    expect(result.current.fallbackTriggered).toBe(true);
    expect(result.current.fallbackReason).toBe('model load timeout');
    expect(result.current.isRecovering).toBe(true);
    expect(result.current.mode).toBe('cloud');
    expect(result.current.retryCount).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.isRecovering).toBe(false);
  });

  it('caps retries at three attempts and supports reset', async () => {
    const { result } = renderHook(() =>
      useExecutionStrategy({
        demoId: 'multimodal',
        executionProfile: 'heavy-local',
        hasCloudFallback: false,
      })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    act(() => {
      result.current.triggerFallback('1');
      result.current.triggerFallback('2');
      result.current.triggerFallback('3');
      result.current.triggerFallback('4');
    });

    expect(result.current.retryCount).toBe(3);
    expect(result.current.mode).toBe('simulated');
    expect(result.current.fallbackReason).toBe('3');

    act(() => {
      result.current.resetFallback();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.fallbackTriggered).toBe(false);
    expect(result.current.fallbackReason).toBeNull();
    expect(result.current.isRecovering).toBe(false);
  });
});
