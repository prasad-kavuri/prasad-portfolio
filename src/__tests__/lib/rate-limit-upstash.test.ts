/**
 * Tests for the Upstash Redis code path in rate-limit.ts.
 * Uses vi.resetModules() + dynamic imports so the module is re-evaluated
 * with env vars set and Upstash mocked.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Must be hoisted so they're available inside the vi.mock factory.
const mockLimit = vi.hoisted(() => vi.fn());
const mockSlidingWindow = vi.hoisted(() => vi.fn().mockReturnValue('sliding-window-config'));

vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    static slidingWindow = mockSlidingWindow;
    limit = mockLimit;
    constructor(_options: unknown) {}
  }
  return { Ratelimit };
});

vi.mock('@upstash/redis', () => {
  class Redis {
    constructor(_options: unknown) {}
  }
  return { Redis };
});

describe('rateLimit — Upstash code path', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    mockLimit.mockReset();
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('returns limited:false when Upstash reports success', async () => {
    mockLimit.mockResolvedValue({ success: true });
    const { rateLimit } = await import('@/lib/rate-limit');
    const result = await rateLimit('1.2.3.4');
    expect(result.limited).toBe(false);
    expect(mockLimit).toHaveBeenCalledTimes(1);
  });

  it('returns limited:true when Upstash denies the request', async () => {
    mockLimit.mockResolvedValue({ success: false });
    const { rateLimit } = await import('@/lib/rate-limit');
    const result = await rateLimit('2.3.4.5');
    expect(result.limited).toBe(true);
    expect(mockLimit).toHaveBeenCalledTimes(1);
  });

  it('hashes the IP before passing it to Upstash', async () => {
    mockLimit.mockResolvedValue({ success: true });
    const { rateLimit } = await import('@/lib/rate-limit');
    await rateLimit('10.0.0.1');
    const calledKey = mockLimit.mock.calls[0][0] as string;
    // Key should be a 64-char hex SHA-256, not the raw IP
    expect(calledKey).toMatch(/^[0-9a-f]{64}$/);
    expect(calledKey).not.toContain('10.0.0.1');
  });

  it('extracts the first IP from a comma-separated x-forwarded-for header', async () => {
    mockLimit.mockResolvedValue({ success: true });
    const { rateLimit } = await import('@/lib/rate-limit');
    await rateLimit('3.3.3.3, 4.4.4.4');
    // Both calls should hash the same leading IP
    const key1 = mockLimit.mock.calls[0][0] as string;
    mockLimit.mockClear();
    await rateLimit('3.3.3.3');
    const key2 = mockLimit.mock.calls[0][0] as string;
    expect(key1).toBe(key2);
  });
});
