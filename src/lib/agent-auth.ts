/**
 * agent-auth.ts
 * Token issuance, verification, and OTP storage for the auth.md demo.
 *
 * Uses Web Crypto API (crypto.subtle) for HMAC-SHA256 — available in both
 * Node.js 18+ and Vercel Edge runtimes.
 * OTP state is stored in Upstash Redis (with in-memory Map fallback for local dev).
 */

import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SECRET = process.env.AGENT_AUTH_SECRET ?? 'portfolio-demo-secret-dev-only-not-for-prod';
export const DEMO_SCOPES = ['read:profile', 'call:mcp-tools'];

const ANON_TTL_S = 3600;    // 1 hour
const CLAIM_TTL_S = 600;    // 10 minutes
const CLAIMED_TTL_S = 86400; // 24 hours

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenPayload {
  sub: string;
  type: 'anonymous' | 'claimed';
  scopes: string[];
  email?: string;
  iat: number;
  exp: number;
}

interface ClaimEntry {
  otp: string;
  email: string;
  anonToken: string;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Redis / in-memory OTP store
// ---------------------------------------------------------------------------

const hasUpstash = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

/* c8 ignore next 6 — Upstash only in production */
const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Fallback for local dev (no Redis)
const claimStore = new Map<string, ClaimEntry>();

export async function storeClaimEntry(claimId: string, entry: ClaimEntry): Promise<void> {
  /* c8 ignore next 5 — Redis path only reachable in production */
  if (redis) {
    await redis.set(`agent-auth:claim:${claimId}`, JSON.stringify(entry), { ex: CLAIM_TTL_S });
    return;
  }
  claimStore.set(claimId, entry);
  // prune expired local entries
  const now = Date.now();
  for (const [k, v] of claimStore) {
    if (v.expiresAt < now) claimStore.delete(k);
  }
}

export async function popClaimEntry(claimId: string): Promise<ClaimEntry | null> {
  /* c8 ignore next 8 — Redis path only reachable in production */
  if (redis) {
    const raw = await redis.get<string>(`agent-auth:claim:${claimId}`);
    if (!raw) return null;
    await redis.del(`agent-auth:claim:${claimId}`); // consume once
    return typeof raw === 'string' ? (JSON.parse(raw) as ClaimEntry) : (raw as ClaimEntry);
  }
  const entry = claimStore.get(claimId) ?? null;
  if (entry) claimStore.delete(claimId);
  return entry;
}

// ---------------------------------------------------------------------------
// Crypto helpers (Web Crypto API)
// ---------------------------------------------------------------------------

async function hmacSign(data: string): Promise<string> {
  const keyMaterial = new TextEncoder().encode(SECRET);
  const key = await crypto.subtle.importKey(
    'raw', keyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlEncode(data: string): string {
  return btoa(unescape(encodeURIComponent(data)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4;
  const padded2 = pad ? padded + '='.repeat(4 - pad) : padded;
  return decodeURIComponent(escape(atob(padded2)));
}

// ---------------------------------------------------------------------------
// Token issuance + verification
// ---------------------------------------------------------------------------

export async function issueToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  ttlSeconds: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: TokenPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const encoded = base64urlEncode(JSON.stringify(full));
  const sig = await hmacSign(encoded);
  return `${encoded}.${sig}`;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacSign(encoded);
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(base64urlDecode(encoded)) as TokenPayload;
    if (Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateRandomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

export function generateOtp(): string {
  const arr = new Uint8Array(3);
  crypto.getRandomValues(arr);
  const num = ((arr[0] << 16) | (arr[1] << 8) | arr[2]) % 1_000_000;
  return num.toString().padStart(6, '0');
}

export { ANON_TTL_S, CLAIM_TTL_S, CLAIMED_TTL_S };
