import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

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

export async function middleware(request: NextRequest) {
  const now = Date.now();
  const key = await hashClient(getClientIp(request));
  const current = buckets.get(key);
  const bucket = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + WINDOW_MS };

  bucket.count += 1;
  buckets.set(key, bucket);

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const remaining = Math.max(0, MAX_REQUESTS - bucket.count);
  const headers = {
    'RateLimit-Limit': String(MAX_REQUESTS),
    'RateLimit-Remaining': String(remaining),
    'RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
  };

  if (bucket.count > MAX_REQUESTS) {
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

  const response = NextResponse.next();
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }
  return response;
}

export function _resetMiddlewareRateLimitForTests(): void {
  buckets.clear();
}

export const config = {
  matcher: ['/api/:path*'],
};
