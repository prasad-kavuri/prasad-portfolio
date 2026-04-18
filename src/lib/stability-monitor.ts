// src/lib/stability-monitor.ts
// Wraps a local inference call with timeout + failure detection.
// On timeout or OOM-like error, calls the provided onFallback callback.

import { INFERENCE_STALL_MS } from './device-intelligence';

export type FailureReason = 'timeout' | 'oom' | 'worker-init' | 'unknown';

export type StabilityMonitorResult<T> =
  | { ok: true; value: T; durationMs: number }
  | { ok: false; reason: FailureReason; error: unknown };

// Known OOM / worker failure error message fragments
const OOM_PATTERNS = [
  'out of memory',
  'oom',
  'allocation failed',
  'webassembly.memory',
  'failed to allocate',
  'exceeded maximum',
];

const WORKER_INIT_PATTERNS = [
  'worker',
  'blob:',
  'failed to fetch',
  'dynamically imported module',
];

function classifyError(err: unknown): FailureReason {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (OOM_PATTERNS.some(p => msg.includes(p))) return 'oom';
  if (WORKER_INIT_PATTERNS.some(p => msg.includes(p))) return 'worker-init';
  return 'unknown';
}

export async function withStabilityMonitor<T>(
  fn: () => Promise<T>,
  options: {
    timeoutMs?: number;
    onFallback?: (reason: FailureReason) => void;
  } = {},
): Promise<StabilityMonitorResult<T>> {
  const timeoutMs = options.timeoutMs ?? INFERENCE_STALL_MS;
  const start = Date.now();

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('inference_timeout')), timeoutMs),
      ),
    ]);
    return { ok: true, value: result, durationMs: Date.now() - start };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const reason: FailureReason =
      msg === 'inference_timeout' ? 'timeout' : classifyError(err);
    options.onFallback?.(reason);
    return { ok: false, reason, error: err };
  }
}
