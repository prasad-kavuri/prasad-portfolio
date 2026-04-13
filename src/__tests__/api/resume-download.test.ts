import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';

function makeRequest(ip = '127.0.0.1', referer?: string) {
  const headers: Record<string, string> = { 'x-forwarded-for': ip };
  if (referer !== undefined) headers['referer'] = referer;
  return new NextRequest('http://localhost/api/resume-download', { method: 'GET', headers });
}

describe('GET /api/resume-download', () => {
  beforeEach(() => {
    _resetStore();
    vi.clearAllMocks();
  });

  it('redirects to the PDF when called without a referer', async () => {
    const { GET } = await import('@/app/api/resume-download/route');
    const res = await GET(makeRequest());
    // 307 redirect
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toMatch(/Prasad_Kavuri_Resume\.pdf/);
  });

  it('redirects when a normal referer header is present', async () => {
    const { GET } = await import('@/app/api/resume-download/route');
    const res = await GET(makeRequest('127.0.0.1', 'https://www.prasadkavuri.com/'));
    expect(res.status).toBe(307);
  });

  it('logs abnormal usage when referer is 200+ chars (triggers the >= 200 branch)', async () => {
    const { GET } = await import('@/app/api/resume-download/route');
    const req = makeRequest('127.0.0.3');
    // req.headers.get('referer') returns null in the test environment for GET requests,
    // so spy on it to return a long value and exercise the warning branch.
    vi.spyOn(req.headers, 'get').mockImplementation((name: string) => {
      if (name === 'referer') return 'https://example.com/' + 'a'.repeat(200); // >200 chars
      return null;
    });
    const res = await GET(req);
    expect(res.status).toBe(307);
  });

  it('returns 429 after exceeding rate limit', async () => {
    const { GET } = await import('@/app/api/resume-download/route');
    const ip = '10.0.0.99';
    for (let i = 0; i < 10; i++) {
      await GET(makeRequest(ip));
    }
    const res = await GET(makeRequest(ip));
    expect(res.status).toBe(429);
  });

  it('returns 500 when an unexpected error is thrown', async () => {
    // Force createRequestContext to throw by passing a broken request
    const { GET } = await import('@/app/api/resume-download/route');
    // Craft a request that causes NextResponse.redirect to throw by
    // providing a relative URL that cannot be resolved
    const badReq = new NextRequest('http://localhost/api/resume-download', {
      method: 'GET',
      headers: { 'x-forwarded-for': '127.0.0.2' },
    });
    // Patch url to trigger the catch branch
    Object.defineProperty(badReq, 'url', { get: () => { throw new Error('forced'); } });
    const res = await GET(badReq);
    expect(res.status).toBe(500);
  });
});
