import { describe, it, expect, beforeEach } from 'vitest';
import {
  logQueryForEval,
  getRecentQueries,
  getQueryCount,
  _resetQueryLog,
} from '@/lib/query-log';

describe('query-log', () => {
  beforeEach(() => {
    _resetQueryLog();
  });

  it('logs a query and retrieves it', () => {
    logQueryForEval('/api/test', 'hello', 'world');
    const queries = getRecentQueries();
    expect(queries).toHaveLength(1);
    expect(queries[0].route).toBe('/api/test');
    expect(queries[0].query).toBe('hello');
    expect(queries[0].response).toBe('world');
    expect(typeof queries[0].id).toBe('string');
    expect(typeof queries[0].timestamp).toBe('number');
  });

  it('truncates query to 200 chars and response to 500 chars', () => {
    const longQuery = 'q'.repeat(300);
    const longResponse = 'r'.repeat(700);
    logQueryForEval('/api/test', longQuery, longResponse);
    const [q] = getRecentQueries();
    expect(q.query.length).toBe(200);
    expect(q.response.length).toBe(500);
  });

  it('stores optional traceId', () => {
    logQueryForEval('/api/test', 'q', 'r', 'trace-abc');
    expect(getRecentQueries()[0].traceId).toBe('trace-abc');
  });

  it('filters by route', () => {
    logQueryForEval('/api/a', 'qa', 'ra');
    logQueryForEval('/api/b', 'qb', 'rb');
    expect(getRecentQueries('/api/a')).toHaveLength(1);
    expect(getRecentQueries('/api/b')).toHaveLength(1);
    expect(getRecentQueries()).toHaveLength(2);
  });

  it('getQueryCount returns count for route', () => {
    logQueryForEval('/api/a', 'q1', 'r1');
    logQueryForEval('/api/a', 'q2', 'r2');
    logQueryForEval('/api/b', 'q3', 'r3');
    expect(getQueryCount('/api/a')).toBe(2);
    expect(getQueryCount('/api/b')).toBe(1);
    expect(getQueryCount()).toBe(3);
  });

  it('evicts oldest entry when buffer exceeds MAX_QUERIES (50)', () => {
    // Fill buffer with 50 entries
    for (let i = 0; i < 50; i++) {
      logQueryForEval('/api/test', `query-${i}`, `response-${i}`);
    }
    expect(getQueryCount()).toBe(50);

    // Adding one more triggers the shift (line 44)
    logQueryForEval('/api/test', 'query-overflow', 'response-overflow');
    expect(getQueryCount()).toBe(50);

    // The oldest entry (query-0) should have been evicted
    const queries = getRecentQueries();
    expect(queries[0].query).toBe('query-1');
    expect(queries[49].query).toBe('query-overflow');
  });

  it('_resetQueryLog clears the buffer', () => {
    logQueryForEval('/api/test', 'q', 'r');
    _resetQueryLog();
    expect(getQueryCount()).toBe(0);
  });
});
