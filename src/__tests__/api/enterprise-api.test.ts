import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';

function makeRequest(params: Record<string, string> = {}, ip = '127.0.0.1') {
  const url = new URL('http://localhost/api/enterprise-sim');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), {
    method: 'GET',
    headers: { 'x-forwarded-for': ip },
  });
}

describe('GET /api/enterprise-sim', () => {
  beforeEach(() => {
    _resetStore();
  });

  it('returns 200 with permissions data', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'permissions' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(5);
  });

  it('returns 200 with spend data', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'spend' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(5);
  });

  it('returns 200 with usage data and default period=30d', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'usage' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.period).toBe('30d');
  });

  it('returns 200 with token data for specific teamId', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'tokens', teamId: 'engineering', days: '30' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(30);
  });

  it('returns 200 with events data', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'events', limit: '10' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(10);
  });

  it('returns 200 with summary data', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'summary', period: '30d' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveProperty('totalTeams');
    expect(body.data.totalTeams).toBe(5);
  });

  it('returns 400 for unknown resource param', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'unknown-resource' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid resource/i);
  });

  it('returns 400 for missing resource param', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('response includes meta.generatedAt as valid ISO timestamp', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'spend' }));
    const body = await res.json();
    expect(body.meta).toHaveProperty('generatedAt');
    expect(() => new Date(body.meta.generatedAt)).not.toThrow();
    expect(new Date(body.meta.generatedAt).toISOString()).toBe(body.meta.generatedAt);
  });

  it('response includes meta.totalRecords matching data length', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'permissions' }));
    const body = await res.json();
    expect(body.meta.totalRecords).toBe(body.data.length);
  });

  it('invalid period param returns 400 with safe error message', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'summary', period: 'invalid' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error).not.toContain('Error:');
    expect(body.error).not.toContain('at ');
  });

  it('response time is under 500ms', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const start = Date.now();
    await GET(makeRequest({ resource: 'permissions' }));
    expect(Date.now() - start).toBeLessThan(500);
  });

  it('does not leak stack traces in error responses', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    const res = await GET(makeRequest({ resource: 'INVALID' }));
    const text = await res.text();
    expect(text).not.toContain('at Object');
    expect(text).not.toContain('node_modules');
  });

  it('response body is always valid JSON', async () => {
    const { GET } = await import('@/app/api/enterprise-sim/route');
    for (const resource of ['permissions', 'spend', 'usage', 'tokens', 'events', 'summary', 'INVALID']) {
      const res = await GET(makeRequest({ resource }));
      const text = await res.text();
      expect(() => JSON.parse(text)).not.toThrow();
    }
  });
});
