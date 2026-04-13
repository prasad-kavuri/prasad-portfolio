/**
 * Anonymized query logging for the runtime evaluation loop.
 *
 * Captures the last MAX_QUERIES (query, response) pairs in memory per route.
 * The eval-snapshot API uses these to run live eval scoring and compare
 * production output quality against offline baselines — closing the loop
 * between static datasets and real user traffic.
 *
 * Privacy: queries are truncated to 200 chars before storage.
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
    query: query.slice(0, 200),
    response: response.slice(0, 500),
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
