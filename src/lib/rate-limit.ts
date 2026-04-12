import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export interface RateLimitResult {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

const hasUpstash = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

let upstashLimiter: Ratelimit | null = null;

/* c8 ignore next 12 — Upstash is only available in production with credentials */
if (hasUpstash) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  upstashLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, '60 s'),
    analytics: true,
    prefix: '@prasadkavuri/ratelimit',
  });
}

interface Entry { count: number; resetAt: number; }
const store = new Map<string, Entry>();

function inMemoryRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    store.set(ip, { count: 1, resetAt });
    return { limited: false, limit: RATE_LIMIT_MAX, remaining: RATE_LIMIT_MAX - 1, resetAt };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { limited: true, limit: RATE_LIMIT_MAX, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count++;
  return {
    limited: false,
    limit: RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt: entry.resetAt,
  };
}

/* c8 ignore next 9 — only called when Upstash is available (production only) */
async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(ip)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function rateLimit(rawIp: string): Promise<RateLimitResult> {
  const ip = rawIp.split(',')[0].trim();
  /* c8 ignore next 4 — Upstash path only reachable in production */
  if (upstashLimiter) {
    const key = await hashIp(ip);
    const { success, limit, remaining, reset } = await upstashLimiter.limit(key);
    return { limited: !success, limit, remaining, resetAt: reset };
  }
  return inMemoryRateLimit(ip);
}

/** Reset the in-memory store — for use in tests only. */
export function _resetStore(): void {
  store.clear();
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /act\s+as\s+(a|an)\s+/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /forget\s+(everything|all)\s+(you|above)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /jailbreak/i,
  /new\s+personality/i,
];

export function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/** Strip script tags, event handlers, and javascript: URIs from LLM output server-side. */
export function sanitizeLLMOutput(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}
