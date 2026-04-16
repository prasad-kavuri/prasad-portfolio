import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SafeFetchError, safeServerFetch } from '@/lib/safe-fetch';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('safeServerFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects blocked outbound targets before fetch', async () => {
    await expect(safeServerFetch('http://127.0.0.1/admin')).rejects.toMatchObject<Partial<SafeFetchError>>({
      name: 'SafeFetchError',
      code: 'blocked_url',
      reason: 'ipv4_loopback',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('follows safe redirects and resolves final response', async () => {
    mockFetch
      .mockResolvedValueOnce({
        status: 302,
        headers: new Headers({ location: 'https://example.com/final' }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers(),
      });

    const res = await safeServerFetch('https://example.com/start', { method: 'POST', body: JSON.stringify({ ok: true }) });

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // 302 on POST should downgrade follow-up to GET (safe browser-compatible behavior).
    expect(mockFetch.mock.calls[1]?.[1]?.method).toBe('GET');
  });

  it('blocks redirects that resolve to internal targets', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 301,
      headers: new Headers({ location: 'http://169.254.169.254/latest/meta-data' }),
    });

    await expect(safeServerFetch('https://example.com/start')).rejects.toMatchObject<Partial<SafeFetchError>>({
      name: 'SafeFetchError',
      code: 'blocked_redirect_target',
      reason: 'ipv4_link_local',
    });
  });

  it('enforces redirect hop limit', async () => {
    mockFetch.mockResolvedValue({
      status: 302,
      headers: new Headers({ location: 'https://example.com/next' }),
    });

    await expect(safeServerFetch('https://example.com/start', {}, { maxRedirects: 1 })).rejects.toMatchObject<Partial<SafeFetchError>>({
      name: 'SafeFetchError',
      code: 'redirect_limit_exceeded',
    });
  });
});
