import { afterEach, describe, expect, it, vi } from 'vitest';
import { scheduleIdleTask } from '@/lib/client-scheduler';
import { loadTransformersModule } from '@/lib/transformers-loader';

describe('client performance utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('falls back to setTimeout when requestIdleCallback is unavailable', () => {
    vi.useFakeTimers();
    const original = (window as Window & { requestIdleCallback?: unknown }).requestIdleCallback;
    delete (window as Window & { requestIdleCallback?: unknown }).requestIdleCallback;

    const task = vi.fn();
    scheduleIdleTask(task);
    vi.advanceTimersByTime(80);

    expect(task).toHaveBeenCalledTimes(1);

    (window as Window & { requestIdleCallback?: unknown }).requestIdleCallback = original;
  });

  it('uses requestIdleCallback when available', () => {
    const idleSpy = vi.fn((callback: () => void) => {
      callback();
      return 1;
    });
    const cancelSpy = vi.fn();
    (window as Window & { requestIdleCallback?: unknown; cancelIdleCallback?: unknown }).requestIdleCallback = idleSpy;
    (window as Window & { requestIdleCallback?: unknown; cancelIdleCallback?: unknown }).cancelIdleCallback = cancelSpy;

    const task = vi.fn();
    const cancel = scheduleIdleTask(task);
    cancel();

    expect(idleSpy).toHaveBeenCalled();
    expect(task).toHaveBeenCalledTimes(1);
    expect(cancelSpy).toHaveBeenCalledWith(1);
  });

  it('caches transformers dynamic import as singleton promise', async () => {
    const first = loadTransformersModule();
    const second = loadTransformersModule();
    const [firstModule, secondModule] = await Promise.all([first, second]);
    expect(firstModule).toBe(secondModule);
  });
});
