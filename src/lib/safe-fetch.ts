import * as dns from 'node:dns/promises';
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

async function assertDnsSafeTarget(url: URL, code: SafeFetchErrorCode = 'blocked_url'): Promise<void> {
  try {
    const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
    for (const record of records) {
      const block = classifyIpAddress(record.address);
      if (block.blocked) {
        throw new SafeFetchError('Blocked outbound URL after DNS resolution', code, block.reason);
      }
    }
  } catch (error) {
    if (error instanceof SafeFetchError) throw error;
    throw new SafeFetchError('DNS resolution failed for outbound URL', 'dns_resolution_failed');
  }
}

export async function assertSafeFetchTarget(url: URL, code: SafeFetchErrorCode = 'blocked_url'): Promise<void> {
  assertSafeTarget(url, code);
  await assertDnsSafeTarget(url, code);
}

/**
 * Server-side fetch wrapper with consistent outbound URL safety checks.
 *
 * Guarantees:
 * - protocol allowlist (`http`/`https`)
 * - credentialed URL blocking
 * - internal/private hostname, IP, and DNS result blocking (via `url-security.ts`)
 * - redirect validation at each hop
 */
export async function safeServerFetch(
  url: string | URL,
  init: RequestInit = {},
  options: SafeFetchOptions = {},
): Promise<Response> {
  const maxRedirects = options.maxRedirects ?? 2;
  let currentUrl = parseRequestUrl(url);
  let currentInit: RequestInit = { ...init, redirect: 'manual' };

  await assertSafeFetchTarget(currentUrl);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const response = await fetch(currentUrl, currentInit);

    if (!isRedirect(response.status)) {
      return response;
    }

    if (redirectCount === maxRedirects) {
      throw new SafeFetchError('Redirect limit exceeded', 'redirect_limit_exceeded');
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new SafeFetchError('Redirect response missing location header', 'redirect_without_location');
    }

    const nextUrl = new URL(location, currentUrl);
    await assertSafeFetchTarget(nextUrl, 'blocked_redirect_target');

    // 303 always, and 301/302 for non-GET/HEAD, should become GET without body.
    const method = (currentInit.method ?? 'GET').toUpperCase();
    if (response.status === 303 || ((response.status === 301 || response.status === 302) && method !== 'GET' && method !== 'HEAD')) {
      currentInit = toSafeGetInit(currentInit);
    }

    currentUrl = nextUrl;
  }

  throw new SafeFetchError('Redirect loop exceeded', 'redirect_limit_exceeded');
}
