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
  traceId?: string;
  requestId?: string;
  durationMs?: number;
  statusCode?: number;
  status?: number;
  latency?: number;
  errorType?: ErrorCategory;
  userHash?: string;
  errorName?: string;
  errorMessage?: string;
  [key: string]: boolean | number | string | null | undefined;
}

export interface AnomalyResult {
  anomaly: boolean;
  reasons: string[];
}

export interface RequestTrace {
  traceId: string;
}

export interface ObservabilitySnapshot {
  requests: Record<string, number>;
  errors: Record<string, number>;
  rateLimited: Record<string, number>;
  rateLimitAllowed: Record<string, number>;
  highFrequency: Record<string, number>;
}

export type ErrorCategory = 'rate_limit' | 'validation' | 'external_api' | 'unknown';

interface ErrorMonitoringPayload {
  route: string;
  traceId?: string;
  durationMs?: number;
  statusCode?: number;
  [key: string]: boolean | number | string | null | undefined;
}

// Thresholds for anomaly detection
const SLOW_RESPONSE_MS = 5_000;
const ERROR_STATUS_THRESHOLD = 500;
const TRACE_ID_PATTERN = /^[a-zA-Z0-9_.:-]{8,128}$/;

const counters: ObservabilitySnapshot = {
  requests: {},
  errors: {},
  rateLimited: {},
  rateLimitAllowed: {},
  highFrequency: {},
};

const failureWindows = new Map<string, number[]>();
const requestWindows = new Map<string, number[]>();

function increment(bucket: Record<string, number>, route: string): void {
  bucket[route] = (bucket[route] ?? 0) + 1;
}

export function createTraceId(incomingTraceId?: string | null): string {
  const normalized = incomingTraceId?.trim();
  if (normalized && TRACE_ID_PATTERN.test(normalized)) {
    return normalized;
  }

  return crypto.randomUUID();
}

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

export function trackAPIRequest(route: string, statusCode: number): void {
  increment(counters.requests, route);
  if (statusCode >= ERROR_STATUS_THRESHOLD) {
    increment(counters.errors, route);
  }
}

export function trackRateLimit(route: string, limited: boolean): void {
  increment(limited ? counters.rateLimited : counters.rateLimitAllowed, route);
}

export function categorizeError(statusCode: number, event = ''): ErrorCategory | undefined {
  if (statusCode === 429) return 'rate_limit';
  if (statusCode >= 400 && statusCode < 500) return 'validation';
  if (/upstream|groq|external|timeout/i.test(event)) return 'external_api';
  if (statusCode >= 500) return 'unknown';
  return undefined;
}

function pruneWindow(values: number[], now: number, windowMs: number): number[] {
  return values.filter(timestamp => now - timestamp <= windowMs);
}

export function detectUsageAnomaly(route: string, statusCode: number, userHash = 'anonymous'): AnomalyResult {
  const now = Date.now();
  const reasons: string[] = [];
  const key = `${route}:${userHash}`;

  const requests = pruneWindow(requestWindows.get(key) ?? [], now, 60_000);
  requests.push(now);
  requestWindows.set(key, requests);
  if (requests.length >= 12) {
    increment(counters.highFrequency, route);
    reasons.push('high_request_frequency');
  }

  if (statusCode >= ERROR_STATUS_THRESHOLD) {
    const failures = pruneWindow(failureWindows.get(key) ?? [], now, 60_000);
    failures.push(now);
    failureWindows.set(key, failures);
    if (failures.length >= 3) {
      reasons.push('repeated_failures');
    }
  }

  return { anomaly: reasons.length > 0, reasons };
}

export function logStructuredRequest(payload: {
  requestId: string;
  route: string;
  status: number;
  latency: number;
  errorType?: ErrorCategory;
  userHash?: string;
}): void {
  logAPIEvent({
    event: 'api.request_summary',
    severity: payload.status >= 500 ? 'error' : payload.status >= 400 ? 'warn' : 'info',
    route: payload.route,
    requestId: payload.requestId,
    traceId: payload.requestId,
    status: payload.status,
    latency: payload.latency,
    errorType: payload.errorType,
    userHash: payload.userHash,
  });
}

export function captureAPIError(
  error: unknown,
  payload: ErrorMonitoringPayload
): void {
  const errorName = error instanceof Error ? error.name : typeof error;

  logAPIEvent({
    ...payload,
    event: 'api.error_captured',
    severity: 'error',
    errorName,
  });
}

export function getObservabilitySnapshot(): ObservabilitySnapshot {
  return {
    requests: { ...counters.requests },
    errors: { ...counters.errors },
    rateLimited: { ...counters.rateLimited },
    rateLimitAllowed: { ...counters.rateLimitAllowed },
    highFrequency: { ...counters.highFrequency },
  };
}

/** Reset in-memory observability counters — for tests only. */
export function _resetObservability(): void {
  counters.requests = {};
  counters.errors = {};
  counters.rateLimited = {};
  counters.rateLimitAllowed = {};
  counters.highFrequency = {};
  failureWindows.clear();
  requestWindows.clear();
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

// ---------------------------------------------------------------------------
// End-to-end Trace ID Propagation
//
// Flow: client generates traceId → passes as X-Trace-Id request header →
//       createRequestContext() in api.ts reads it → all log events and LLM
//       calls include it → full session reconstruction from a single ID.
//
// Server side: createRequestContext() (src/lib/api.ts) already reads
//   req.headers.get('x-trace-id') and passes it to createTraceId().
// Client side: use generateClientTraceId() + createTracedFetch() below.
// ---------------------------------------------------------------------------

/**
 * Generate a UUID v4 trace ID on the client at interaction start.
 * Pass the returned ID to createTracedFetch() so every request in the
 * session carries the same traceId through to the server logs.
 *
 * @example
 * const traceId = generateClientTraceId();
 * const fetcher = createTracedFetch(traceId);
 * const res = await fetcher('/api/portfolio-assistant', { method: 'POST', ... });
 */
export function generateClientTraceId(): string {
  return crypto.randomUUID();
}

/**
 * Returns a fetch wrapper that injects X-Trace-Id and X-Request-Id headers
 * on every call, enabling end-to-end trace correlation from browser to logs.
 *
 * The same traceId appears in:
 *   1. The initial user interaction event (client)
 *   2. The API route log (server — via createRequestContext)
 *   3. The LLM completion call (server — forwarded in logApiEvent)
 *   4. The response headers (X-Trace-Id echoed back by finalizeApiResponse)
 */
export function createTracedFetch(traceId: string) {
  return (url: string, init: RequestInit = {}): Promise<Response> => {
    const existingHeaders = (init.headers ?? {}) as Record<string, string>;
    return fetch(url, {
      ...init,
      headers: {
        ...existingHeaders,
        'X-Trace-Id': traceId,
        'X-Request-Id': traceId,
      },
    });
  };
}
