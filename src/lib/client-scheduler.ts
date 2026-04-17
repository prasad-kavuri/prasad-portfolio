export type CancelScheduledTask = () => void;

const IDLE_TIMEOUT_MS = 1200;

type IdleDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleCallback = (deadline: IdleDeadline) => void;

type WindowWithIdleCallbacks = Window & {
  requestIdleCallback?: (callback: IdleCallback, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function scheduleIdleTask(task: () => void, timeout = IDLE_TIMEOUT_MS): CancelScheduledTask {
  if (typeof window === 'undefined') return () => undefined;

  const w = window as WindowWithIdleCallbacks;

  if (typeof w.requestIdleCallback === 'function') {
    const handle = w.requestIdleCallback(
      () => {
        task();
      },
      { timeout }
    );
    return () => {
      if (typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(handle);
      }
    };
  }

  const fallbackHandle = window.setTimeout(task, 64);
  return () => window.clearTimeout(fallbackHandle);
}
