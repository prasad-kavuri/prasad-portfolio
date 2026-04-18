import { describe, it, expect, vi } from 'vitest';
import { withStabilityMonitor } from '@/lib/stability-monitor';

describe('withStabilityMonitor', () => {
  it('returns ok result for fast functions', async () => {
    const result = await withStabilityMonitor(() => Promise.resolve('done'));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('done');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns timeout failure for slow functions', async () => {
    vi.useFakeTimers();
    const slowFn = () => new Promise<string>(resolve => setTimeout(() => resolve('late'), 5000));
    const resultPromise = withStabilityMonitor(slowFn, { timeoutMs: 100 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('timeout');
    }
    vi.useRealTimers();
  });

  it('classifies OOM-like errors correctly', async () => {
    const oomFn = () => Promise.reject(new Error('WebAssembly.Memory out of memory'));
    const result = await withStabilityMonitor(oomFn);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('oom');
    }
  });

  it('classifies worker init errors correctly', async () => {
    const workerFn = () => Promise.reject(new Error('Failed to fetch worker blob: script'));
    const result = await withStabilityMonitor(workerFn);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('worker-init');
    }
  });

  it('calls onFallback callback on failure', async () => {
    const onFallback = vi.fn();
    const failFn = () => Promise.reject(new Error('allocation failed'));
    await withStabilityMonitor(failFn, { onFallback });
    expect(onFallback).toHaveBeenCalledOnce();
    expect(onFallback).toHaveBeenCalledWith('oom');
  });
});
