import * as dns from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import { isIP } from 'node:net';
import { Agent } from 'undici';
import { classifyIpAddress, isBlockedOutboundUrl } from '@/lib/url-security';

type SafeFetchErrorCode =
  | 'invalid_url'
  | 'blocked_url'
  | 'dns_resolution_failed'
  | 'redirect_without_location'
  | 'redirect_limit_exceeded'
  | 'blocked_redirect_target';

export class SafeFetchError extends Error {
  constructor(
    message: string,
    public readonly code: SafeFetchErrorCode,
    public readonly reason?: string,
  ) {
    super(message);
    this.name = 'SafeFetchError';
  }
}

export interface SafeFetchOptions {
  maxRedirects?: number;
}

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function toSafeGetInit(init: RequestInit): RequestInit {
  // Per Fetch semantics, 303 always converts to GET.
  const next: RequestInit = { ...init, method: 'GET', body: undefined };
  const headers = new Headers(init.headers ?? undefined);
  headers.delete('content-type');
  return { ...next, headers };
}

function parseRequestUrl(url: string | URL): URL {
  try {
    return typeof url === 'string' ? new URL(url) : new URL(url.toString());
  } catch {
    throw new SafeFetchError('Invalid outbound URL', 'invalid_url');
  }
}

function assertSafeTarget(url: URL, code: SafeFetchErrorCode = 'blocked_url'): void {
  const block = isBlockedOutboundUrl(url);
  if (block.blocked) {
    throw new SafeFetchError('Blocked outbound URL', code, block.reason);
  }
}

async function resolveSafeTarget(url: URL, code: SafeFetchErrorCode = 'blocked_url'): Promise<LookupAddress[]> {
  try {
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    if (!records.length) throw new Error('Empty DNS answer');
    for (const record of records) {
      if (!isIP(record.address) || isIP(record.address) !== record.family) throw new Error('Invalid DNS answer');
      const block = classifyIpAddress(record.address);
      if (block.blocked) {
        throw new SafeFetchError('Blocked outbound URL after DNS resolution', code, block.reason);
      }
    }
    return records;
  } catch (error) {
    if (error instanceof SafeFetchError) throw error;
    throw new SafeFetchError('DNS resolution failed for outbound URL', 'dns_resolution_failed');
  }
}

/** Preflight only; separate downstream fetches still need connection-time DNS protection. */
export async function assertSafeFetchTarget(url: URL, code: SafeFetchErrorCode = 'blocked_url'): Promise<void> {
  assertSafeTarget(url, code);
  await resolveSafeTarget(url, code);
}

/**
 * Server-side fetch wrapper with consistent outbound URL safety checks.
 *
 * Guarantees:
 * - protocol allowlist (`http`/`https`)
 * - credentialed URL blocking
 * - internal/private hostname, IP, and DNS result blocking (via `url-security.ts`)
 * - redirect validation and connection DNS pinning at each hop
 */
export async function safeServerFetch(
  url: string | URL,
  init: RequestInit = {},
  options: SafeFetchOptions = {},
): Promise<Response> {
  const maxRedirects = options.maxRedirects ?? 2;
  let currentUrl = parseRequestUrl(url);
  let currentInit: RequestInit = { ...init, redirect: 'manual' };

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const code = redirectCount === 0 ? 'blocked_url' : 'blocked_redirect_target';
    assertSafeTarget(currentUrl, code);
    const addresses = await resolveSafeTarget(currentUrl, code);
    const dispatcher = new Agent({
      connect: {
        lookup(_hostname, lookupOptions, callback) {
          if (lookupOptions.all) callback(null, addresses);
          else callback(null, addresses[0].address, addresses[0].family);
        },
      },
    });
    let response: Response;
    try {
      const pinnedInit: RequestInit & { dispatcher: Agent } = { ...currentInit, cache: 'no-store', dispatcher };
      response = await fetch(currentUrl, pinnedInit);
    } finally {
      // Graceful close waits for the response body; do not block its caller.
      void dispatcher.close().catch(() => dispatcher.destroy());
    }

    if (!isRedirect(response.status)) {
      return response;
    }
    await response.body?.cancel();

    if (redirectCount === maxRedirects) {
      throw new SafeFetchError('Redirect limit exceeded', 'redirect_limit_exceeded');
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new SafeFetchError('Redirect response missing location header', 'redirect_without_location');
    }

    const nextUrl = new URL(location, currentUrl);
    const headers = new Headers(currentInit.headers);
    if (nextUrl.origin !== currentUrl.origin && ['authorization', 'cookie', 'proxy-authorization'].some((name) => headers.has(name))) {
      throw new SafeFetchError('Credentialed cross-origin redirect blocked', 'blocked_redirect_target', 'cross_origin_credentials');
    }

    // 303 always, and 301/302 for non-GET/HEAD, should become GET without body.
    const method = (currentInit.method ?? 'GET').toUpperCase();
    if (response.status === 303 || ((response.status === 301 || response.status === 302) && method !== 'GET' && method !== 'HEAD')) {
      currentInit = toSafeGetInit(currentInit);
    }

    currentUrl = nextUrl;
  }

  throw new SafeFetchError('Redirect loop exceeded', 'redirect_limit_exceeded');
}
