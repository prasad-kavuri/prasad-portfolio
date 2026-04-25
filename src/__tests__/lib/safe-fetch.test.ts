import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lookup } from 'node:dns/promises';
import { SafeFetchError, safeServerFetch } from '@/lib/safe-fetch';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(),
  default: {
    lookup: vi.fn(),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
const mockLookup = vi.mocked(lookup);

describe('safeServerFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  it.each([
    ['localhost', 'http://localhost/admin', 'localhost'],
    ['127.0.0.1', 'http://127.0.0.1/admin', 'ipv4_loopback'],
    ['169.254.169.254', 'http://169.254.169.254/latest/meta-data', 'ipv4_link_local'],
    ['private IPv4', 'http://10.1.2.3/admin', 'ipv4_private'],
    ['IPv6 loopback', 'http://[::1]/admin', 'ipv6_loopback'],
    ['IPv6 private', 'http://[fc00::1234]/admin', 'ipv6_unique_local'],
    ['IPv6 link-local', 'http://[fe80::1]/admin', 'ipv6_link_local'],
  ])('rejects blocked outbound target: %s', async (_label, url, reason) => {
    await expect(safeServerFetch(url)).rejects.toMatchObject<Partial<SafeFetchError>>({
      name: 'SafeFetchError',
      code: 'blocked_url',
      reason,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('blocks public hostnames that resolve to private addresses', async () => {
    mockLookup.mockResolvedValueOnce([{ address: '192.168.1.10', family: 4 }]);

    await expect(safeServerFetch('https://example.com/start')).rejects.toMatchObject<Partial<SafeFetchError>>({
      name: 'SafeFetchError',
      code: 'blocked_url',
      reason: 'ipv4_private',
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
    mockLookup
      .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }])
      .mockResolvedValueOnce([{ address: '169.254.169.254', family: 4 }]);
    mockFetch.mockResolvedValueOnce({
      status: 301,
      headers: new Headers({ location: 'https://metadata.example/latest/meta-data' }),
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
