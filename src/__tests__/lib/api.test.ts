import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  captureAndLogApiError,
  createRequestContext,
  enforceRateLimit,
  finalizeApiResponse,
  getClientIp,
  isStringArray,
  jsonError,
  readJsonObject,
} from '@/lib/api';
import { _resetStore, RATE_LIMIT_MAX } from '@/lib/rate-limit';
import { _resetObservability, getObservabilitySnapshot } from '@/lib/observability';

function makeRequest(body = '{}', headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  });
}

describe('api helpers', () => {
  beforeEach(() => {
    _resetStore();
    _resetObservability();
    vi.restoreAllMocks();
  });

  it('creates request context from incoming request id', () => {
    const req = makeRequest('{}', { 'x-request-id': 'trace-api-test-1' });
    const context = createRequestContext(req, '/api/test');

    expect(context).toMatchObject({
      route: '/api/test',
      method: 'POST',
      traceId: 'trace-api-test-1',
    });
  });

  it('extracts client IP with x-real-ip fallback', () => {
    const req = makeRequest('{}', { 'x-real-ip': '203.0.113.8' });
    expect(getClientIp(req)).toBe('203.0.113.8');
  });

  it('prefers x-forwarded-for and falls back to the provided anonymous key', () => {
    const forwardedReq = makeRequest('{}', {
      'x-forwarded-for': '203.0.113.9, 198.51.100.4',
      'x-real-ip': '203.0.113.8',
    });
    const fallbackReq = makeRequest('{}');

    expect(getClientIp(forwardedReq)).toBe('203.0.113.9, 198.51.100.4');
    expect(getClientIp(fallbackReq, 'fallback-client')).toBe('fallback-client');
  });

  it('adds trace, rate-limit, and timing headers while tracking requests', async () => {
    const req = makeRequest('{}', { 'x-request-id': 'trace-api-test-2' });
    const context = createRequestContext(req, '/api/test');
    await enforceRateLimit(req, 'anonymous', { context });

    const response = finalizeApiResponse(Response.json({ ok: true }), context);

    expect(response.headers.get('x-request-id')).toBe('trace-api-test-2');
    expect(response.headers.get('x-trace-id')).toBe('trace-api-test-2');
    expect(response.headers.get('server-timing')).toMatch(/app;dur=/);
    expect(response.headers.get('x-ratelimit-limit')).toBe(String(RATE_LIMIT_MAX));
    expect(response.headers.get('x-ratelimit-remaining')).toBe(String(RATE_LIMIT_MAX - 1));
    expect(getObservabilitySnapshot().requests['/api/test']).toBe(1);
  });

  it('returns traced JSON errors', async () => {
    const req = makeRequest('{}', { 'x-request-id': 'trace-api-test-3' });
    const context = createRequestContext(req, '/api/test');
    const response = jsonError('Bad input', 400, { context });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get('x-request-id')).toBe('trace-api-test-3');
    expect(body).toEqual({ error: 'Bad input', requestId: 'trace-api-test-3' });
  });

  it('returns JSON errors without trace headers when no trace metadata exists', async () => {
    const response = jsonError('Bad input', 400);
    const body = await response.json();

    expect(response.headers.get('x-request-id')).toBeNull();
    expect(body).toEqual({ error: 'Bad input' });
  });

  it('finalizes malformed JSON responses and tracks them', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const req = makeRequest('{bad-json', { 'x-request-id': 'trace-api-test-4' });
    const context = createRequestContext(req, '/api/test');

    const result = await readJsonObject(req, { context });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      expect(result.response.headers.get('x-request-id')).toBe('trace-api-test-4');
    }
    expect(getObservabilitySnapshot().requests['/api/test']).toBe(1);
    expect(warn).toHaveBeenCalled();
  });

  it('rejects non-object JSON bodies without requiring request context', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const req = makeRequest('[]');

    const result = await readJsonObject(req, { route: '/api/test', traceId: 'trace-api-test-6' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      expect(result.response.headers.get('x-request-id')).toBe('trace-api-test-6');
    }
    expect(getObservabilitySnapshot().requests['/api/test']).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it('accepts valid JSON objects', async () => {
    const req = makeRequest('{"message":"hello"}');

    const result = await readJsonObject(req);

    expect(result).toEqual({ ok: true, data: { message: 'hello' } });
  });

  it('tracks allowed and blocked rate-limit attempts', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const req = makeRequest('{}', { 'x-forwarded-for': '203.0.113.77' });
      const context = createRequestContext(req, '/api/test');
      expect(await enforceRateLimit(req, 'anonymous', { context })).toBeNull();
    }

    const blockedReq = makeRequest('{}', { 'x-forwarded-for': '203.0.113.77' });
    const blockedContext = createRequestContext(blockedReq, '/api/test');
    const blocked = await enforceRateLimit(blockedReq, 'anonymous', { context: blockedContext });

    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(getObservabilitySnapshot().rateLimitAllowed['/api/test']).toBe(RATE_LIMIT_MAX);
    expect(getObservabilitySnapshot().rateLimited['/api/test']).toBe(1);
    expect(warn).toHaveBeenCalled();
  });

  it('rate-limits without context while preserving explicit trace metadata', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const req = makeRequest('{}', { 'x-forwarded-for': '203.0.113.88' });
      expect(await enforceRateLimit(req, 'anonymous', { route: '/api/no-context' })).toBeNull();
    }

    const blockedReq = makeRequest('{}', { 'x-forwarded-for': '203.0.113.88' });
    const blocked = await enforceRateLimit(blockedReq, 'anonymous', {
      route: '/api/no-context',
      traceId: 'trace-api-test-7',
    });
    const body = await blocked?.json();

    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get('x-request-id')).toBe('trace-api-test-7');
    expect(body).toEqual({ error: 'Too many requests', requestId: 'trace-api-test-7' });
    expect(getObservabilitySnapshot().rateLimitAllowed['/api/no-context']).toBe(RATE_LIMIT_MAX);
    expect(getObservabilitySnapshot().rateLimited['/api/no-context']).toBe(1);
    expect(warn).toHaveBeenCalled();
  });

  it('validates string arrays with item and length constraints', () => {
    expect(isStringArray(['a', 'b'], { maxItems: 2, maxItemLength: 1 })).toBe(true);
    expect(isStringArray('not-array')).toBe(false);
    expect(isStringArray(['a', 'b', 'c'], { maxItems: 2 })).toBe(false);
    expect(isStringArray(['too-long'], { maxItemLength: 3 })).toBe(false);
    expect(isStringArray(['ok', 1])).toBe(false);
  });

  it('captures API errors with trace metadata', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    captureAndLogApiError('api.request_failed', new Error('sensitive'), {
      route: '/api/test',
      traceId: 'trace-api-test-5',
      status: 500,
      durationMs: 12,
    });

    expect(error).toHaveBeenCalledTimes(2);
    const captured = JSON.parse(error.mock.calls[1][0] as string);
    expect(captured).toMatchObject({
      event: 'api.error_captured',
      route: '/api/test',
      traceId: 'trace-api-test-5',
      errorName: 'Error',
    });
    expect(JSON.stringify(captured)).not.toContain('sensitive');
  });
});
