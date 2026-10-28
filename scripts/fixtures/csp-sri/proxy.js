import { NextResponse } from 'next/server';

export function proxy(request) {
  if (process.env.CSP_FIXTURE_MODE !== 'nonce') return NextResponse.next();
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const policy = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'`;
  const headers = new Headers(request.headers);
  headers.set('Content-Security-Policy', policy);
  headers.set('x-nonce', nonce);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
}
