/**
 * Lightweight observability utilities for API routes.
 *
 * Provides:
 *  - Structured JSON event logging with consistent schema
 *  - Anomaly detection for request patterns (slow responses, high error rates)
 *  - Request timing helpers
 */

export type Severity = 'info' | 'warn' | 'error';

export interface APIEventPayload {
  event: string;
  route: string;
  severity: Severity;
  durationMs?: number;
  statusCode?: number;
  errorName?: string;
  errorMessage?: string;
  [key: string]: boolean | number | string | null | undefined;
}

export interface AnomalyResult {
  anomaly: boolean;
  reasons: string[];
}

// Thresholds for anomaly detection
const SLOW_RESPONSE_MS = 5_000;
const ERROR_STATUS_THRESHOLD = 500;

/**
 * Emit a structured JSON log event to stdout/stderr.
 * Each entry has a consistent schema: timestamp, severity, event, route.
 */
export function logAPIEvent(payload: APIEventPayload): void {
  const entry = {
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const line = JSON.stringify(entry);
  if (payload.severity === 'error') {
    console.error(line);
  } else if (payload.severity === 'warn') {
    console.warn(line);
  } else {
    console.info(line);
  }
}

/**
 * Detect anomalies in a completed API request.
 *
 * Rules:
 *  - Slow response: durationMs >= SLOW_RESPONSE_MS
 *  - Server error: statusCode >= 500
 *  - Both together: escalate to error severity in the returned result
 *
 * Returns an AnomalyResult; callers decide what to do with it
 * (typically emit an additional warn/error log).
 */
export function detectAnomaly(
  durationMs: number,
  statusCode: number
): AnomalyResult {
  const reasons: string[] = [];

  if (durationMs >= SLOW_RESPONSE_MS) {
    reasons.push(`slow_response: ${durationMs}ms >= ${SLOW_RESPONSE_MS}ms`);
  }
  if (statusCode >= ERROR_STATUS_THRESHOLD) {
    reasons.push(`server_error: status ${statusCode}`);
  }

  return { anomaly: reasons.length > 0, reasons };
}

/**
 * Start a request timer and return a function that, when called,
 * returns the elapsed milliseconds.
 */
export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}
