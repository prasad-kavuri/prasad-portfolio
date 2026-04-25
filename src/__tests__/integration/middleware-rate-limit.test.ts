import { beforeEach, describe, expect, it } from 'vitest';
import { middleware, _resetMiddlewareRateLimitForTests } from '../../../middleware';

function createRequest(ip: string): Request {
  return new Request('https://www.prasadkavuri.com/api/test', {
    headers: {
      'x-forwarded-for': ip,
    },
  });
}

describe('API middleware rate limiting', () => {
  beforeEach(() => {
    _resetMiddlewareRateLimitForTests();
  });

  it('returns 429 JSON with rate-limit headers after the limit is exceeded', async () => {
    let response: Response | undefined;

    for (let i = 0; i < 61; i += 1) {
      response = await middleware(createRequest('203.0.113.10') as never);
    }

    expect(response?.status).toBe(429);
    expect(response?.headers.get('Retry-After')).toBeTruthy();
    expect(response?.headers.get('RateLimit-Limit')).toBe('60');
    expect(response?.headers.get('RateLimit-Remaining')).toBe('0');
    await expect(response?.json()).resolves.toEqual({ error: 'Too many requests' });
  });
});
