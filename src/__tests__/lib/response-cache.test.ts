import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResponseCacheContext } from '@/lib/response-cache';

const context: ResponseCacheContext = {
  profile: { personal: { title: 'Current role' }, knowledgeBase: ['Current facts'] },
  systemPrompt: 'Answer using the current profile.',
  models: ['primary-model', 'fallback-model'],
  responseVersion: '1',
};
let cache: typeof import('@/lib/response-cache');

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  cache = await import('@/lib/response-cache');
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('versioned response cache identity', () => {
  it('is deterministic and exposes only the namespace and SHA-256 digest', async () => {
    const key = await cache.makeCacheKey('private question', true, context);
    expect(key).toBe(await cache.makeCacheKey('private question', true, JSON.parse(JSON.stringify(context))));
    expect(key).toMatch(/^pa-cache:v2:[a-f0-9]{64}$/);
    expect(key).not.toMatch(/private|Current|primary-model/);
  });

  it.each([
    { profile: { personal: { title: 'Updated role' }, knowledgeBase: ['Current facts'] } },
    { profile: { personal: { title: 'Current role' }, knowledgeBase: ['Updated facts'] } },
    { systemPrompt: 'Updated response instructions.' },
    { models: ['new-primary', 'fallback-model'] },
    { models: ['primary-model', 'new-fallback'] },
    { models: ['fallback-model', 'primary-model'] },
    { responseVersion: '2' },
  ])('isolates cached answers after context changes: %j', async (change) => {
    const original = await cache.makeCacheKey('question', false, context);
    const updated = await cache.makeCacheKey('question', false, { ...context, ...change });
    await cache.setResponseCache(original, 'Old answer');
    expect(updated).not.toBe(original);
    expect(await cache.getResponseCache(updated)).toBeNull();
    expect(await cache.getResponseCache(original)).toBe('Old answer');
  });

  it('separates questions, RAG modes and legacy entries', async () => {
    const key = await cache.makeCacheKey('question', false, context);
    expect(await cache.makeCacheKey('other question', false, context)).not.toBe(key);
    expect(await cache.makeCacheKey('question', true, context)).not.toBe(key);
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('question|false'));
    const legacyKey = `pa-cache:${Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
    await cache.setResponseCache(legacyKey, 'Legacy answer');
    expect(await cache.getResponseCache(key)).toBeNull();
    expect(await cache.getResponseCache(legacyKey)).toBe('Legacy answer');
  });

  it('preserves the local 24-hour expiry and 100-entry capacity', async () => {
    vi.useFakeTimers();
    await cache.setResponseCache('expires', 'answer');
    vi.advanceTimersByTime(86_399_000);
    expect(await cache.getResponseCache('expires')).toBe('answer');
    vi.advanceTimersByTime(1_001);
    expect(await cache.getResponseCache('expires')).toBeNull();
    for (let i = 0; i < 101; i++) await cache.setResponseCache(`key-${i}`, `answer-${i}`);
    expect(await cache.getResponseCache('key-0')).toBeNull();
    expect(await cache.getResponseCache('key-100')).toBe('answer-100');
  });

  it('preserves the Redis TTL and versioned key for reads and writes', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'synthetic-token');
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: 'answer' })));
    const key = await cache.makeCacheKey('question', true, context);
    await cache.setResponseCache(key, 'answer');
    expect(fetch.mock.calls[0][0]).toBe(`https://test.upstash.io/set/${encodeURIComponent(key)}`);
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual(['answer', 'EX', 86_400]);
    expect(await cache.getResponseCache(key)).toBe('answer');
    expect(fetch.mock.calls[1][0]).toBe(`https://test.upstash.io/get/${encodeURIComponent(key)}`);
  });
});
