/**
 * Anonymized query logging for the runtime evaluation loop.
 *
 * Captures the last MAX_QUERIES (query, response) pairs in memory per route.
 * The eval-snapshot API uses these to run live eval scoring and compare
 * production output quality against offline baselines — closing the loop
 * between static datasets and real user traffic.
 *
 * Privacy: queries are redacted and truncated to 200 chars before storage.
 * No user-identifying information is retained.
 */

export interface QueryRecord {
  id: string;
  route: string;
  query: string;    // Anonymized: max 200 chars
  response: string; // First 500 chars
  timestamp: number;
  traceId?: string;
}

const MAX_QUERIES = 50;
const queryBuffer: QueryRecord[] = [];

const REDACTION_PATTERNS: Array<[RegExp, string]> = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]'],
  [/\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g, '[redacted-phone]'],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi, 'Bearer [redacted-token]'],
  [/\b(?:sk|gsk|pk|api|key|token)_[A-Za-z0-9_-]{16,}\b/gi, '[redacted-api-key]'],
  [/\b[A-Z][A-Z0-9_]{2,}\s*=\s*["']?[^"'\s]{8,}["']?/g, '[redacted-env]'],
];

export function redactQueryLogText(value: string): string {
  return REDACTION_PATTERNS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value
  );
}

/**
 * Log an anonymized (query, response) pair for later eval scoring.
 * Call this after every successful LLM completion.
 */
export function logQueryForEval(
  route: string,
  query: string,
  response: string,
  traceId?: string
): void {
  queryBuffer.push({
    id: crypto.randomUUID(),
    route,
    query: redactQueryLogText(query).slice(0, 200),
    response: redactQueryLogText(response).slice(0, 500),
    timestamp: Date.now(),
    traceId,
  });
  if (queryBuffer.length > MAX_QUERIES) {
    queryBuffer.shift();
  }
}

export function getRecentQueries(route?: string): QueryRecord[] {
  const all = [...queryBuffer];
  return route ? all.filter(q => q.route === route) : all;
}

export function getQueryCount(route?: string): number {
  return getRecentQueries(route).length;
}

/** Reset in-memory query log — for tests only. */
export function _resetQueryLog(): void {
  queryBuffer.length = 0;
}
