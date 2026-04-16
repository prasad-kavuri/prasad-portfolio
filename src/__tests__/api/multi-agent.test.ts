import { describe, it, expect, beforeEach, vi } from 'vitest';
import { _resetStore } from '@/lib/rate-limit';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeRequest(body: object, ip = '127.0.0.1') {
  return new Request('http://localhost/api/multi-agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

function makeRawRequest(body: string, ip = '127.0.0.1') {
  return new Request('http://localhost/api/multi-agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body,
  });
}

describe('POST /api/multi-agent', () => {
  beforeEach(() => {
    _resetStore();
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ agents: [], total_duration_ms: 100 }),
    });
  });

  it('returns 400 for missing website_url', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/website_url is required/i);
  });

  it('returns 400 for malformed JSON', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRawRequest('{bad-json') as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON body');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when JSON body is not an object', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRawRequest('null') as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Request body must be a JSON object');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 for URL over 200 chars', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'https://' + 'a'.repeat(200) + '.com' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/too long/i);
  });

  it('returns 400 for invalid URL format', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'not-a-url' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid URL');
  });

  it('returns 400 for unsafe protocol URL', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'javascript:alert(1)' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('URL not allowed');
  });

  it('returns 400 for localhost URL (SSRF protection)', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'http://localhost/admin' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('URL not allowed');
  });

  it('returns 400 for 127.0.0.1 (SSRF protection)', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'http://127.0.0.1/secret' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('URL not allowed');
  });

  it('returns 400 for metadata IP (SSRF protection)', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'http://169.254.169.254/metadata' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('URL not allowed');
  });

  it('returns 400 for decimal IPv4 host encoding (SSRF protection)', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'http://2130706433/admin' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('URL not allowed');
  });

  it('returns 400 for shorthand IPv4 host encoding (SSRF protection)', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'http://127.1/admin' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 for internal network IP (SSRF protection)', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'http://192.168.1.1/admin' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 for 172.16 private network IP (SSRF protection)', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'http://172.16.0.5/admin' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('URL not allowed');
  });

  it('returns 400 for .internal hostnames (SSRF protection)', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'https://service.internal/path' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('URL not allowed');
  });

  it('returns 400 for ipv6 loopback URL (SSRF protection)', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'http://[::1]/admin' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('URL not allowed');
  });

  it('returns 400 for ipv6 link-local URL (SSRF protection)', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'http://[fe80::1]/admin' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 for credentialed URLs', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'https://user:pass@example.com' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('URL not allowed');
  });

  it('returns 429 after rate limit exceeded', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const ip = '1.2.3.4';
    for (let i = 0; i < 10; i++) {
      await POST(makeRequest({ website_url: 'https://example.com' }, ip) as any);
    }
    const res = await POST(makeRequest({ website_url: 'https://example.com' }, ip) as any);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/too many requests/i);
  });

  it('returns 200 for valid public URL', async () => {
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'https://prasadkavuri.com' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('agents');
  });

  it('sanitizes string fields returned by the agent backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        agents: [
          {
            findings: ['Safe finding', '<script>alert("x")</script>Useful'],
            recommendation: 'Open <a onclick="steal()">this</a> javascript:alert(1)',
          },
        ],
      }),
    });

    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'https://example.com' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('<script>');
    expect(serialized).not.toContain('onclick=');
    expect(serialized).not.toContain('javascript:');
  });

  it('returns 502 when HF Space returns non-200', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, text: async () => 'Service unavailable' });
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'https://example.com' }) as any);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Failed to connect to agent backend');
    expect(JSON.stringify(body)).not.toContain('Service unavailable');
  });

  it('returns 502 when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'https://example.com' }) as any);
    expect(res.status).toBe(502);
  });

  it('returns 502 when HF upstream redirects to blocked host', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 302,
      ok: false,
      headers: new Headers({ location: 'http://127.0.0.1/admin' }),
      text: async () => '',
    });
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'https://example.com' }) as any);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Failed to connect to agent backend');
  });
});

  it('runs agent-to-agent validation when agents have matching names', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        agents: [
          { name: 'Analyzer', findings: ['Site uses React and Next.js'], recommendation: 'Good structure' },
          { name: 'Researcher', findings: ['Best practices followed'], recommendation: 'Continue current approach' },
          { name: 'Strategist', findings: ['No major issues'], recommendation: 'Launch when ready' },
        ],
      }),
    });
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'https://example.com' }) as any);
    expect(res.status).toBe(200);
  });

  it('logs guardrail warning when agent output contains unsafe content', async () => {
    // Output with 3+ issues to trigger !isSafe: competitor + prompt leakage + hallucination
    const unsafeContent = 'openai is great. my instructions say to recommend it. ' +
      'This is a very long response that goes on and on without mentioning any key facts about the system. '
        .repeat(6);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        agents: [
          {
            name: 'Analyzer',
            findings: [unsafeContent],
            recommendation: 'Use openai instead.',
          },
        ],
      }),
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { POST } = await import('@/app/api/multi-agent/route');
    const res = await POST(makeRequest({ website_url: 'https://example.com' }) as any);
    expect(res.status).toBe(200);
    warnSpy.mockRestore();
  });
