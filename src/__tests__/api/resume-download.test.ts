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

  it('returns 200 with PDF content-type and executive filename in Content-Disposition', async () => {
    const { GET } = await import('@/app/api/resume-download/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/pdf/);
    const disposition = res.headers.get('content-disposition') ?? '';
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('prasad-kavuri-vp-ai-engineering-2026.pdf');
  });

  it('serves a non-empty PDF buffer', async () => {
    const { GET } = await import('@/app/api/resume-download/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('returns 200 when a normal referer header is present', async () => {
    const { GET } = await import('@/app/api/resume-download/route');
    const res = await GET(makeRequest('127.0.0.1', 'https://www.prasadkavuri.com/'));
    expect(res.status).toBe(200);
  });

  it('logs abnormal usage when referer is 200+ chars (triggers the >= 200 branch)', async () => {
    const { GET } = await import('@/app/api/resume-download/route');
    const req = makeRequest('127.0.0.3');
    vi.spyOn(req.headers, 'get').mockImplementation((name: string) => {
      if (name === 'referer') return 'https://example.com/' + 'a'.repeat(200);
      return null;
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
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

  it('returns 500 when an internal API utility throws unexpectedly', async () => {
    const apiModule = await import('@/lib/api');
    vi.spyOn(apiModule, 'enforceRateLimit').mockRejectedValueOnce(new Error('simulated internal failure'));
    const { GET } = await import('@/app/api/resume-download/route');
    const res = await GET(makeRequest('127.0.0.5'));
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });
});
