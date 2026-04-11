interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export function rateLimit(ip: string): { limited: boolean } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { limited: true };
  }

  entry.count++;
  return { limited: false };
}

/** Reset the store — for use in tests only. */
export function _resetStore(): void {
  store.clear();
}
