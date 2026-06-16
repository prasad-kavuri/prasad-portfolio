/**
 * response-cache.ts
 *
 * Application-level response cache for the portfolio-assistant route.
 *
 * Why this exists
 * ───────────────
 * The portfolio-assistant sends the same ~4KB system prompt (full profile) on
 * every request. In a real inference cluster, LMCache would cache the KV tensors
 * for that shared prefix, slashing TTFT for every subsequent request.
 *
 * On Vercel + Groq (managed inference), we don't control the serving layer, so
 * we cache at the application boundary instead: store the complete LLM response
 * text in Upstash Redis keyed on a hash of (userQuery + useRAG flag).
 *
 * The principle is identical — avoid recomputing what you've already computed.
 * The mechanism is one layer higher.
 *
 * Scope
 * ─────
 * Only single-turn queries are cached (messages.length === 1). Multi-turn
 * conversations are unique per session and must always hit the model.
 *
 * TTL: 24 hours (profile data doesn't change intra-day).
 * Key prefix: "pa-cache:" to avoid collisions with rate-limit keys.
 */

// ─── Redis client (same Upstash instance as rate limiting) ──────────────────

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts: { ex: number }): Promise<unknown>;
};

function getRedis(): RedisClient | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  // Lazily import to avoid bundling in edge contexts that don't need it.
  // We use the REST API directly so this file stays free of npm imports.
  return {
    async get(key: string): Promise<string | null> {
      try {
        const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) return null;
        const json = await res.json() as { result: string | null };
        return json.result ?? null;
      } catch {
        return null;
      }
    },

    async set(key: string, value: string, { ex }: { ex: number }): Promise<void> {
      try {
        await fetch(`${url}/set/${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([value, 'EX', ex]),
          signal: AbortSignal.timeout(2000),
        });
      } catch {
        // Cache write failure is non-fatal — let the response through.
      }
    },
  };
}

// In-memory fallback for local dev (no Redis configured)
const localCache = new Map<string, { value: string; expiresAt: number }>();

// ─── SHA-256 key derivation ──────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const KEY_PREFIX = 'pa-cache:';
const TTL_SECONDS = 86_400; // 24 hours

export async function makeCacheKey(query: string, useRAG: boolean): Promise<string> {
  const hash = await sha256Hex(`${query}|${useRAG}`);
  return `${KEY_PREFIX}${hash}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getResponseCache(key: string): Promise<string | null> {
  const redis = getRedis();
  if (redis) return redis.get(key);

  // Local fallback
  const entry = localCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { localCache.delete(key); return null; }
  return entry.value;
}

export async function setResponseCache(key: string, value: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(key, value, { ex: TTL_SECONDS });
    return;
  }

  // Local fallback — cap at 100 entries to avoid unbounded memory growth
  if (localCache.size >= 100) {
    const oldest = localCache.keys().next().value;
    if (oldest) localCache.delete(oldest);
  }
  localCache.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
}
