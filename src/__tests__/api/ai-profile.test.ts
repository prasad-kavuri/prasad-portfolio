import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/rate-limit')>();
  return { ...mod, enforceRateLimit: vi.fn().mockResolvedValue(null) };
});

import { GET } from '@/app/ai-profile.json/route';

describe('GET /ai-profile.json', () => {
  beforeEach(() => {
    _resetStore?.();
    vi.clearAllMocks();
  });

  function makeRequest() {
    return new NextRequest('http://localhost:3000/ai-profile.json', {
      headers: { accept: 'application/json' },
    });
  }

  it('returns 200 with Content-Type application/json', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('response body parses as valid JSON', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toBeTruthy();
    expect(typeof body).toBe('object');
  });

  it('demos array has length > 0', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(Array.isArray(body.demos)).toBe(true);
    expect(body.demos.length).toBeGreaterThan(0);
  });

  it('identity.name === "Prasad Kavuri"', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.identity.name).toBe('Prasad Kavuri');
  });

  it('agent_guidance.flagship_demo is a valid URL string', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    const flagship = body.agent_guidance.flagship_demo;
    expect(typeof flagship).toBe('string');
    expect(() => new URL(flagship)).not.toThrow();
  });
});
