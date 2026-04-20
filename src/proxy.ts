import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveLegacyHtmlPath } from '@/data/legacy-routes';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Canonical legacy .html policy: known slugs map directly; unknown slugs land on /demos.
  const legacyDestination = resolveLegacyHtmlPath(pathname);
  if (legacyDestination) {
    return NextResponse.redirect(new URL(legacyDestination, request.url), { status: 301 });
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://va.vercel-scripts.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.groq.com https://*.hf.space https://huggingface.co https://*.huggingface.co https://cdn-lfs.huggingface.co blob: https://va.vercel-scripts.com; frame-ancestors 'none';"
  );
  // Required for SharedArrayBuffer used by WASM multi-threading
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
