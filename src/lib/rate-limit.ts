interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export function rateLimit(rawIp: string): { limited: boolean } {
  // Normalize: take first IP from comma-separated x-forwarded-for list
  const ip = rawIp.split(',')[0].trim();
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
