import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 30
const counts = new Map<string, { n: number; reset: number }>()

async function hashIP(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(ip + (process.env.RATE_LIMIT_SALT ?? 'portfolio'))
  )
  return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  const raw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'anon'
  const key = await hashIP(raw)
  const now = Date.now()
  const rec = counts.get(key)
  if (!rec || now > rec.reset) {
    counts.set(key, { n: 1, reset: now + WINDOW_MS })
    return NextResponse.next()
  }
  rec.n++
  if (rec.n > MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too Many Requests', retryAfter: Math.ceil((rec.reset - now) / 1000) },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rec.reset - now) / 1000)), 'X-RateLimit-Limit': String(MAX_REQUESTS), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(rec.reset) } }
    )
  }
  return NextResponse.next()
}

export const config = { matcher: '/api/:path*' }
