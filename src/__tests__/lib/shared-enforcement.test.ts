import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@upstash/redis', () => ({ Redis: class {
  set = vi.fn().mockRejectedValue(new Error('private-provider-detail'));
  get = vi.fn().mockRejectedValue(new Error('private-provider-detail'));
  getdel = vi.fn().mockRejectedValue(new Error('private-provider-detail'));
  eval = vi.fn().mockRejectedValue(new Error('private-provider-detail'));
} }));
vi.mock('@upstash/ratelimit', () => ({ Ratelimit: class {
  static slidingWindow = vi.fn();
  limit = vi.fn().mockRejectedValue(new Error('private-provider-detail'));
} }));

describe('shared production enforcement', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it.each(['production', 'preview'])('rejects all local shared-state operations in hosted %s', async (environment) => {
    vi.stubEnv('VERCEL_ENV', environment);
    const { kvSetJson, kvGetJson, kvTakeJson, kvIncrWithTtl } = await import('@/lib/durable-store');
    const { rateLimit } = await import('@/lib/rate-limit');
    await expect(kvSetJson('key', {}, 60)).rejects.toThrow('Shared state');
    await expect(kvGetJson('key')).rejects.toThrow('Shared state');
    await expect(kvTakeJson('key')).rejects.toThrow('Shared state');
    await expect(kvIncrWithTtl('key', 60)).rejects.toThrow('Shared state');
    await expect(rateLimit('client')).rejects.toThrow('Shared rate limiting');
  });

  it.each([false, true])('returns safe traced 503 responses with Redis configured=%s', async (configured) => {
    if (configured) {
      vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test.upstash.io');
      vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    }
    const { createRequestContext, enforceRateLimit, enforceDailyBudget } = await import('@/lib/api');
    const req = new NextRequest('https://example.com/api/test');
    const context = createRequestContext(req, '/api/test');
    context.userHash = 'test-user';
    for (const response of [await enforceRateLimit(req, 'client', { context }), await enforceDailyBudget(context)]) {
      expect(response?.status).toBe(503);
      expect(response?.headers.get('x-trace-id')).toBe(context.traceId);
      expect(await response!.text()).not.toMatch(/private-provider-detail|Redis|UPSTASH/);
    }
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('private-provider-detail');
  });

  it.each(['development', 'test', 'production'])('keeps unhosted local %s fallbacks available', async (environment) => {
    vi.stubEnv('NODE_ENV', environment);
    vi.stubEnv('VERCEL_ENV', undefined);
    const { kvIncrWithTtl } = await import('@/lib/durable-store');
    const { rateLimit } = await import('@/lib/rate-limit');
    expect(await kvIncrWithTtl('key', 60)).toBe(1);
    expect((await rateLimit('client')).limited).toBe(false);
  });
});
