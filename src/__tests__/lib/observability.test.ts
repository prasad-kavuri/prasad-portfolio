/**
 * Unit tests for src/lib/observability.ts
 * Covers structured logging, anomaly detection, and timer utilities.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  _resetObservability,
  captureAPIError,
  createTraceId,
  detectAnomaly,
  getObservabilitySnapshot,
  logAPIEvent,
  startTimer,
  trackAPIRequest,
  trackRateLimit,
} from '@/lib/observability';

afterEach(() => {
  vi.restoreAllMocks();
  _resetObservability();
});

describe('logAPIEvent: structured JSON logging', () => {
  it('emits JSON to console.info for info severity', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logAPIEvent({ event: 'test.event', route: '/api/test', severity: 'info' });
    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output).toHaveProperty('event', 'test.event');
    expect(output).toHaveProperty('route', '/api/test');
    expect(output).toHaveProperty('severity', 'info');
    expect(output).toHaveProperty('timestamp');
  });

  it('emits JSON to console.warn for warn severity', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logAPIEvent({ event: 'test.warn', route: '/api/test', severity: 'warn' });
    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.severity).toBe('warn');
  });

  it('emits JSON to console.error for error severity', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logAPIEvent({ event: 'test.error', route: '/api/test', severity: 'error' });
    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.severity).toBe('error');
  });

  it('includes optional fields when provided', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logAPIEvent({
      event: 'api.completed',
      route: '/api/llm-router',
      severity: 'info',
      durationMs: 123,
      statusCode: 200,
    });
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output).toHaveProperty('durationMs', 123);
    expect(output).toHaveProperty('statusCode', 200);
  });

  it('timestamp is a valid ISO 8601 string', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logAPIEvent({ event: 'test', route: '/api/test', severity: 'info' });
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(new Date(output.timestamp).toISOString()).toBe(output.timestamp);
  });
});

describe('request tracing', () => {
  it('uses a valid incoming trace id', () => {
    expect(createTraceId('trace-abc_123')).toBe('trace-abc_123');
  });

  it('generates a new trace id for invalid input', () => {
    const generated = createTraceId('bad trace id with spaces');
    expect(generated).not.toBe('bad trace id with spaces');
    expect(generated).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('in-memory observability counters', () => {
  it('tracks request and error counts by route', () => {
    trackAPIRequest('/api/test', 200);
    trackAPIRequest('/api/test', 500);

    const snapshot = getObservabilitySnapshot();
    expect(snapshot.requests['/api/test']).toBe(2);
    expect(snapshot.errors['/api/test']).toBe(1);
  });

  it('tracks rate-limit allowed and blocked counts by route', () => {
    trackRateLimit('/api/test', false);
    trackRateLimit('/api/test', true);

    const snapshot = getObservabilitySnapshot();
    expect(snapshot.rateLimitAllowed['/api/test']).toBe(1);
    expect(snapshot.rateLimited['/api/test']).toBe(1);
  });
});

describe('captureAPIError', () => {
  it('emits a sanitized error monitoring event', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    captureAPIError(new TypeError('sensitive message'), {
      route: '/api/test',
      traceId: 'trace-12345',
      statusCode: 500,
      durationMs: 42,
    });

    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output).toMatchObject({
      event: 'api.error_captured',
      route: '/api/test',
      traceId: 'trace-12345',
      severity: 'error',
      errorName: 'TypeError',
      statusCode: 500,
      durationMs: 42,
    });
    expect(JSON.stringify(output)).not.toContain('sensitive message');
  });
});

describe('detectAnomaly: anomaly detection rules', () => {
  it('returns no anomaly for fast successful request', () => {
    const result = detectAnomaly(100, 200);
    expect(result.anomaly).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it('flags slow response at exactly the 5000ms threshold', () => {
    const result = detectAnomaly(5000, 200);
    expect(result.anomaly).toBe(true);
    expect(result.reasons[0]).toMatch(/slow_response/);
  });

  it('flags slow response above threshold', () => {
    const result = detectAnomaly(9999, 200);
    expect(result.anomaly).toBe(true);
    expect(result.reasons.some(r => r.includes('slow_response'))).toBe(true);
  });

  it('does not flag responses under the threshold', () => {
    const result = detectAnomaly(4999, 200);
    expect(result.anomaly).toBe(false);
  });

  it('flags 5xx status codes as server errors', () => {
    const result = detectAnomaly(100, 500);
    expect(result.anomaly).toBe(true);
    expect(result.reasons[0]).toMatch(/server_error/);
  });

  it('flags both slow response AND server error together', () => {
    const result = detectAnomaly(6000, 503);
    expect(result.anomaly).toBe(true);
    expect(result.reasons).toHaveLength(2);
  });

  it('does not flag 4xx as server errors', () => {
    const result = detectAnomaly(100, 400);
    expect(result.anomaly).toBe(false);
  });
});

describe('startTimer: request timing', () => {
  it('returns a function that measures elapsed milliseconds', async () => {
    const stop = startTimer();
    await new Promise(r => setTimeout(r, 20));
    const ms = stop();
    expect(ms).toBeGreaterThanOrEqual(10);
    expect(ms).toBeLessThan(1000);
  });

  it('two consecutive calls return increasing durations', async () => {
    const stop = startTimer();
    await new Promise(r => setTimeout(r, 10));
    const first = stop();
    await new Promise(r => setTimeout(r, 10));
    const second = stop();
    expect(second).toBeGreaterThanOrEqual(first);
  });
});
