/**
 * Minimal durable key-value store for cross-invocation state (pending approvals, daily budgets).
 *
 * Serverless functions don't share memory, so production state lives in Upstash Redis — the same
 * store rate limiting and agent-auth already use. Local dev and tests fall back to an in-process Map
 * with TTLs. Keep this surface small: set-with-TTL, atomic take (single use), and counter-with-TTL.
 */
import { Redis } from '@upstash/redis';

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

/* c8 ignore next 6 — Upstash only in production */
const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

interface MemEntry { value: string; expiresAt: number }
const mem = new Map<string, MemEntry>();

function memGet(key: string): MemEntry | null {
  const entry = mem.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    mem.delete(key);
    return null;
  }
  return entry;
}

/** Store a JSON value that expires after `ttlSeconds`. */
export async function kvSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const raw = JSON.stringify(value);
  /* c8 ignore next 4 — Redis path only reachable in production */
  if (redis) {
    await redis.set(key, raw, { ex: ttlSeconds });
    return;
  }
  mem.set(key, { value: raw, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/** Read and delete a value atomically — the primitive behind single-use approvals. */
export async function kvTakeJson<T>(key: string): Promise<T | null> {
  /* c8 ignore next 5 — Redis path only reachable in production */
  if (redis) {
    const raw = await redis.getdel<string | T>(key);
    if (raw === null || raw === undefined) return null;
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
  }
  const entry = memGet(key);
  if (!entry) return null;
  mem.delete(key);
  return JSON.parse(entry.value) as T;
}

/** Read a value without consuming it. */
export async function kvGetJson<T>(key: string): Promise<T | null> {
  /* c8 ignore next 5 — Redis path only reachable in production */
  if (redis) {
    const raw = await redis.get<string | T>(key);
    if (raw === null || raw === undefined) return null;
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
  }
  const entry = memGet(key);
  return entry ? (JSON.parse(entry.value) as T) : null;
}

/** Increment a counter, setting its TTL when it is first created. Returns the new value. */
export async function kvIncrWithTtl(key: string, ttlSeconds: number): Promise<number> {
  /* c8 ignore next 5 — Redis path only reachable in production */
  if (redis) {
    const value = await redis.incr(key);
    if (value === 1) await redis.expire(key, ttlSeconds);
    return value;
  }
  const entry = memGet(key);
  const next = (entry ? Number(entry.value) : 0) + 1;
  mem.set(key, { value: String(next), expiresAt: entry?.expiresAt ?? Date.now() + ttlSeconds * 1000 });
  return next;
}

/** Test-only: clear the in-memory fallback. */
export function _resetDurableStore(): void {
  mem.clear();
}
