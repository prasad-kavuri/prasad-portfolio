import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';
import { UPSTREAM_BUSY_MESSAGE } from '@/lib/groq-models';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/generative-ui', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/generative-ui', () => {
  beforeEach(() => {
    _resetStore();
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it('says the demo is busy when Groq rate-limits the request', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'rate_limit_exceeded' } }), { status: 429 }));
    const { POST } = await import('@/app/api/generative-ui/route');
    const res = await POST(makeRequest({ query: 'Compare three AI platforms' }));
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toBe(UPSTREAM_BUSY_MESSAGE);
  });

  it('returns 500 for another upstream failure', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 401 }));
    const { POST } = await import('@/app/api/generative-ui/route');
    const res = await POST(makeRequest({ query: 'Compare three AI platforms' }));
    expect(res.status).toBe(500);
  });
});
