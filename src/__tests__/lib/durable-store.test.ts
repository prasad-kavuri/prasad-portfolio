import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('durable-store — in-memory fallback', () => {
  beforeEach(async () => {
    vi.useRealTimers();
    const { _resetDurableStore } = await import('@/lib/durable-store');
    _resetDurableStore();
  });

  afterEach(() => vi.useRealTimers());

  it('stores, reads, and atomically takes JSON values (single use)', async () => {
    const { kvSetJson, kvGetJson, kvTakeJson } = await import('@/lib/durable-store');
    await kvSetJson('k', { a: 1 }, 60);
    expect(await kvGetJson('k')).toEqual({ a: 1 });
    expect(await kvTakeJson('k')).toEqual({ a: 1 });
    expect(await kvTakeJson('k')).toBeNull();
    expect(await kvGetJson('k')).toBeNull();
  });

  it('expires values after their TTL', async () => {
    vi.useFakeTimers();
    const { kvSetJson, kvGetJson, kvTakeJson } = await import('@/lib/durable-store');
    await kvSetJson('ttl', 'v', 10);
    vi.setSystemTime(Date.now() + 11_000);
    expect(await kvGetJson('ttl')).toBeNull();
    await kvSetJson('ttl2', 'v', 10);
    vi.setSystemTime(Date.now() + 11_000);
    expect(await kvTakeJson('ttl2')).toBeNull();
  });

  it('increments counters and restarts them after expiry', async () => {
    vi.useFakeTimers();
    const { kvIncrWithTtl } = await import('@/lib/durable-store');
    expect(await kvIncrWithTtl('c', 5)).toBe(1);
    expect(await kvIncrWithTtl('c', 5)).toBe(2);
    vi.setSystemTime(Date.now() + 6_000);
    expect(await kvIncrWithTtl('c', 5)).toBe(1);
  });
});

const redisStore = vi.hoisted(() => new Map<string, unknown>());
vi.mock('@upstash/redis', () => {
  class Redis {
    async set(key: string, value: unknown) { redisStore.set(key, value); return 'OK'; }
    async get(key: string) { return redisStore.has(key) ? redisStore.get(key) : null; }
    async getdel(key: string) {
      const value = redisStore.has(key) ? redisStore.get(key) : null;
      redisStore.delete(key);
      return value;
    }
    async incr(key: string) {
      const next = Number(redisStore.get(key) ?? 0) + 1;
      redisStore.set(key, next);
      return next;
    }
    async expire() { return 1; }
  }
  return { Redis };
});

describe('durable-store — Upstash path', () => {
  beforeEach(() => {
    vi.resetModules();
    redisStore.clear();
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('uses Redis for set/get/take/incr, including pre-parsed values', async () => {
    const { kvSetJson, kvGetJson, kvTakeJson, kvIncrWithTtl } = await import('@/lib/durable-store');
    await kvSetJson('r', { b: 2 }, 60);
    expect(await kvGetJson('r')).toEqual({ b: 2 });
    expect(await kvTakeJson('r')).toEqual({ b: 2 });
    expect(await kvTakeJson('r')).toBeNull();
    expect(await kvGetJson('r')).toBeNull();

    redisStore.set('parsed', { already: 'object' });
    expect(await kvGetJson('parsed')).toEqual({ already: 'object' });
    expect(await kvTakeJson('parsed')).toEqual({ already: 'object' });

    expect(await kvIncrWithTtl('n', 60)).toBe(1);
    expect(await kvIncrWithTtl('n', 60)).toBe(2);
  });
});
