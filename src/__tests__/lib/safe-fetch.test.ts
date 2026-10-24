import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lookup } from 'node:dns/promises';
import { safeServerFetch } from '@/lib/safe-fetch';
import type { LookupFunction } from 'node:net';

const agents = vi.hoisted(() => [] as Array<{ lookup: LookupFunction; close: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> }>);
vi.mock('undici', () => ({
  Agent: class {
    close = vi.fn().mockResolvedValue(undefined);
    destroy = vi.fn().mockResolvedValue(undefined);
    constructor(options: { connect: { lookup: LookupFunction } }) {
      agents.push({ lookup: options.connect.lookup, close: this.close, destroy: this.destroy });
    }
  },
}));

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(),
  default: {
    lookup: vi.fn(),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
const mockLookup = vi.mocked(
  lookup as unknown as (hostname: string, options: { all: true; verbatim: true }) => Promise<Array<{ address: string; family: 4 | 6 }>>
);

describe('safeServerFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agents.length = 0;
    mockLookup.mockReset();
    mockFetch.mockReset();
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  it('pins connection lookups to the validated result without resolving DNS again', async () => {
    const validated = [{ address: '93.184.216.34', family: 4 }, { address: '2606:4700:4700::1111', family: 6 }];
    mockLookup
      .mockResolvedValueOnce(validated as Array<{ address: string; family: 4 | 6 }>)
      .mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }]);
    mockFetch.mockResolvedValueOnce({ status: 200 });
    await safeServerFetch('https://example.com/start');
    const single = vi.fn();
    const all = vi.fn();
    agents[0].lookup('example.com', {}, single);
    agents[0].lookup('example.com', { all: true }, all);
    expect(single).toHaveBeenCalledWith(null, '93.184.216.34', 4);
    expect(all).toHaveBeenCalledWith(null, validated);
    expect(mockLookup).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0].hostname).toBe('example.com');
    expect(mockFetch.mock.calls[0][1]).toMatchObject({ cache: 'no-store', redirect: 'manual', dispatcher: expect.anything() });
    expect(agents[0].close).toHaveBeenCalledOnce();
  });

  it.each([
    { records: [] },
    { records: [{ address: 'invalid', family: 4 }] },
    { records: [{ address: '93.184.216.34', family: 6 }] },
  ])('rejects unusable DNS results %j', async ({ records }) => {
    mockLookup.mockResolvedValueOnce(records as Array<{ address: string; family: 4 | 6 }>);
    await expect(safeServerFetch('https://example.com/')).rejects.toMatchObject({ code: 'dns_resolution_failed' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects a mixed public/private DNS answer rather than selecting the public address', async () => {
    mockLookup.mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.1', family: 4 }]);
    await expect(safeServerFetch('https://example.com/')).rejects.toMatchObject({ code: 'blocked_url' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('independently pins redirects and cancels their discarded response bodies', async () => {
    mockLookup
      .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }])
      .mockResolvedValueOnce([{ address: '2606:4700:4700::1111', family: 6 }]);
    const cancel = vi.fn().mockResolvedValue(undefined);
    mockFetch.mockResolvedValueOnce({ status: 302, headers: new Headers({ location: '/next' }), body: { cancel } })
      .mockResolvedValueOnce({ status: 200 });
    await safeServerFetch('https://example.com/');
    const callback = vi.fn();
    agents[1].lookup('example.com', {}, callback);
    expect(callback).toHaveBeenCalledWith(null, '2606:4700:4700::1111', 6);
    expect(agents).toHaveLength(2);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('closes agents on fetch failure and destroys them if graceful close fails', async () => {
    mockFetch.mockImplementationOnce(async () => {
      agents[0].close.mockRejectedValueOnce(new Error('close failed'));
      throw new Error('fetch failed');
    });
    await expect(safeServerFetch('https://example.com/')).rejects.toThrow('fetch failed');
    expect(agents[0].close).toHaveBeenCalledOnce();
    expect(agents[0].destroy).toHaveBeenCalledOnce();
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
    await expect(safeServerFetch(url)).rejects.toMatchObject({
      name: 'SafeFetchError',
      code: 'blocked_url',
      reason,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('blocks public hostnames that resolve to private addresses', async () => {
    mockLookup.mockResolvedValueOnce([{ address: '192.168.1.10', family: 4 }]);

    await expect(safeServerFetch('https://example.com/start')).rejects.toMatchObject({
      name: 'SafeFetchError',
      code: 'blocked_url',
      reason: 'ipv4_private',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each(['::ffff:7f00:1', '0:0:0:0:0:ffff:c0a8:101', 'febf::1'])('blocks unsafe IPv6 DNS answer %s before fetching', async (address) => {
    mockLookup.mockResolvedValueOnce([{ address, family: 6 }]);
    await expect(safeServerFetch('https://example.com/start')).rejects.toMatchObject({ code: 'blocked_url' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('blocks a redirect whose DNS resolves to mapped metadata IPv4', async () => {
    mockLookup
      .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }])
      .mockResolvedValueOnce([{ address: '::ffff:a9fe:a9fe', family: 6 }]);
    mockFetch.mockResolvedValueOnce({ status: 302, headers: new Headers({ location: 'https://metadata.example/' }) });
    await expect(safeServerFetch('https://example.com/start')).rejects.toMatchObject({ code: 'blocked_redirect_target', reason: 'ipv4_link_local' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
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

  it.each(['authorization', 'cookie', 'proxy-authorization'])('does not forward %s across origins', async (header) => {
    mockFetch.mockResolvedValueOnce({ status: 307, headers: new Headers({ location: 'https://other.example/collect' }) });
    await expect(safeServerFetch('https://example.com/start', { headers: { [header]: 'synthetic-test-value' } }))
      .rejects.toMatchObject({ code: 'blocked_redirect_target', reason: 'cross_origin_credentials' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('preserves authorization on a same-origin redirect', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 307, headers: new Headers({ location: '/final' }) })
      .mockResolvedValueOnce({ status: 200 });
    await safeServerFetch('https://example.com/start', { headers: { authorization: 'synthetic-test-value' } });
    expect(new Headers(mockFetch.mock.calls[1][1].headers).get('authorization')).toBe('synthetic-test-value');
  });

  it('allows an uncredentialed public cross-origin redirect', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 302, headers: new Headers({ location: 'https://cdn.example/file' }) })
      .mockResolvedValueOnce({ status: 200 });
    expect((await safeServerFetch('https://example.com/start')).status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('blocks redirects that resolve to internal targets', async () => {
    mockLookup
      .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }])
      .mockResolvedValueOnce([{ address: '169.254.169.254', family: 4 }]);
    mockFetch.mockResolvedValueOnce({
      status: 301,
      headers: new Headers({ location: 'https://metadata.example/latest/meta-data' }),
    });

    await expect(safeServerFetch('https://example.com/start')).rejects.toMatchObject({
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

    await expect(safeServerFetch('https://example.com/start', {}, { maxRedirects: 1 })).rejects.toMatchObject({
      name: 'SafeFetchError',
      code: 'redirect_limit_exceeded',
    });
  });

  it('rejects invalid URLs and DNS failures before fetching', async () => {
    await expect(safeServerFetch('not a url')).rejects.toMatchObject({
      name: 'SafeFetchError',
      code: 'invalid_url',
    });

    mockLookup.mockRejectedValueOnce(new Error('lookup failed'));
    await expect(safeServerFetch(new URL('https://example.com/start'))).rejects.toMatchObject({
      name: 'SafeFetchError',
      code: 'dns_resolution_failed',
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('requires redirect locations and preserves HEAD on 301/302', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 302,
      headers: new Headers(),
    });

    await expect(safeServerFetch('https://example.com/start')).rejects.toMatchObject({
      name: 'SafeFetchError',
      code: 'redirect_without_location',
    });

    mockFetch
      .mockResolvedValueOnce({
        status: 301,
        headers: new Headers({ location: '/final' }),
      })
      .mockResolvedValueOnce({
        status: 204,
        ok: true,
        headers: new Headers(),
      });

    const res = await safeServerFetch('https://example.com/start', { method: 'HEAD' });
    expect(res.status).toBe(204);
    expect(mockFetch.mock.calls.at(-1)?.[1]?.method).toBe('HEAD');
  });

  it('converts 303 redirects to GET and strips content type', async () => {
    mockFetch
      .mockResolvedValueOnce({
        status: 303,
        headers: new Headers({ location: '/final' }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers(),
      });

    await safeServerFetch('https://example.com/start', {
      method: 'POST',
      body: 'payload',
      headers: { 'content-type': 'application/json' },
    });

    const followUpInit = mockFetch.mock.calls[1]?.[1];
    expect(followUpInit?.method).toBe('GET');
    expect(followUpInit?.body).toBeUndefined();
    expect(new Headers(followUpInit?.headers).has('content-type')).toBe(false);
  });
});
