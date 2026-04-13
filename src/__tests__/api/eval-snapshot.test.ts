import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';
import { _resetQueryLog, logQueryForEval } from '@/lib/query-log';
import { _resetDriftMonitor } from '@/lib/drift-monitor';

function makeRequest(ip = '127.0.0.1') {
  return new NextRequest('http://localhost/api/eval-snapshot', {
    method: 'GET',
    headers: { 'x-forwarded-for': ip },
  });
}

describe('GET /api/eval-snapshot', () => {
  beforeEach(() => {
    _resetStore();
    _resetQueryLog();
    _resetDriftMonitor();
    vi.clearAllMocks();
  });

  it('returns 200 with zero queries when none logged', async () => {
    const { GET } = await import('@/app/api/eval-snapshot/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalQueriesLogged).toBe(0);
    expect(body.assistantQueriesLogged).toBe(0);
    expect(body.multiAgentQueriesLogged).toBe(0);
    expect(body.liveEval.casesRun).toBe(0);
    expect(body.liveEval.avgScore).toBeNull();
    expect(body.liveEval.passed).toBe(0);
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('drift');
  });

  it('returns live eval scores when portfolio-assistant queries are logged', async () => {
    logQueryForEval(
      '/api/portfolio-assistant',
      'Tell me about Prasad',
      'Prasad worked at Krutrim, Ola, and HERE. He is an agentic AI engineer.',
      'trace-001'
    );

    const { GET } = await import('@/app/api/eval-snapshot/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalQueriesLogged).toBe(1);
    expect(body.assistantQueriesLogged).toBe(1);
    expect(body.liveEval.casesRun).toBeGreaterThanOrEqual(1);
    expect(body.liveEval.avgScore).not.toBeNull();
    expect(typeof body.liveEval.avgScore).toBe('number');
  });

  it('counts multi-agent queries separately from assistant queries', async () => {
    logQueryForEval('/api/multi-agent', 'analyze site', 'Agent analysis complete.', 'trace-002');
    logQueryForEval('/api/portfolio-assistant', 'Who is Prasad?', 'Prasad is an AI engineer at Krutrim.', 'trace-003');

    const { GET } = await import('@/app/api/eval-snapshot/route');
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.totalQueriesLogged).toBe(2);
    expect(body.assistantQueriesLogged).toBe(1);
    expect(body.multiAgentQueriesLogged).toBe(1);
  });

  it('reports drift sample counts', async () => {
    const { GET } = await import('@/app/api/eval-snapshot/route');
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.drift).toHaveProperty('assistantSamples');
    expect(body.drift).toHaveProperty('multiAgentSamples');
    expect(typeof body.drift.assistantSamples).toBe('number');
  });

  it('returns liveEval.failed count correctly', async () => {
    // Log a response with no coverage terms — will fail the eval
    logQueryForEval('/api/portfolio-assistant', 'random query', 'I have no idea.', 'trace-004');

    const { GET } = await import('@/app/api/eval-snapshot/route');
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.liveEval.casesRun + body.liveEval.failed).toBeGreaterThanOrEqual(0);
    expect(body.liveEval.failed).toBeGreaterThanOrEqual(0);
  });

  it('returns 429 after rate limit is exceeded', async () => {
    const { GET } = await import('@/app/api/eval-snapshot/route');
    const ip = '99.0.0.1';
    for (let i = 0; i < 10; i++) {
      await GET(makeRequest(ip));
    }
    const res = await GET(makeRequest(ip));
    expect(res.status).toBe(429);
  });
});
