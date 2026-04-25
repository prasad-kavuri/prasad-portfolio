import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveLegacyHtmlPath } from '@/data/legacy-routes';

const WINDOW_MS = 60_000;
const MAX_API_REQUESTS = 60;

type Bucket = {
  count: number;
  resetAt: number;
};

const apiBuckets = new Map<string, Bucket>();

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || request.headers.get('x-real-ip') || 'unknown';
}

async function hashClient(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://va.vercel-scripts.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.groq.com https://huggingface.co https://*.huggingface.co https://cdn-lfs.huggingface.co https://va.vercel-scripts.com blob:; frame-ancestors 'none';"
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  return response;
}

async function applyApiRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const now = Date.now();
  const key = await hashClient(getClientIp(request));
  const current = apiBuckets.get(key);
  const bucket = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + WINDOW_MS };

  bucket.count += 1;
  apiBuckets.set(key, bucket);

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const headers = {
    'RateLimit-Limit': String(MAX_API_REQUESTS),
    'RateLimit-Remaining': String(Math.max(0, MAX_API_REQUESTS - bucket.count)),
    'RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
  };

  if (bucket.count <= MAX_API_REQUESTS) {
    return null;
  }

  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        ...headers,
        'Retry-After': String(retryAfter),
      },
    }
  );
}

export function _resetProxyRateLimitForTests(): void {
  apiBuckets.clear();
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Canonical legacy .html policy: known slugs map directly; unknown slugs land on /demos.
  const legacyDestination = resolveLegacyHtmlPath(pathname);
  if (legacyDestination) {
    return NextResponse.redirect(new URL(legacyDestination, request.url), { status: 301 });
  }

  if (pathname.startsWith('/api/')) {
    return applyApiRateLimit(request).then((limited) =>
      applySecurityHeaders(limited ?? NextResponse.next())
    );
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
