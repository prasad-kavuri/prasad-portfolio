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

  it('returns canonical identity facts', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.identity.contact.email).toBe('vbkpkavuri@gmail.com');
    expect(body.identity.role).toBe('VP / Head of AI Engineering');
    expect(body.experience.team_size_max).toBe('200+');
  });

  it('returns executive-only target role guidance', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.positioning_level).toBe('Executive AI Engineering Leadership');
    expect(body.target_roles).toEqual([
      'VP of AI Engineering',
      'Head of AI Engineering',
      'Senior Director, AI Platform',
      'Head of Applied AI',
      'VP, AI Platform Engineering',
    ]);
    expect(body.not_positioned_for).toEqual(
      expect.arrayContaining([
        'IC engineering roles',
        'Staff Engineer roles',
        'Principal Engineer roles',
        'Lead Engineer roles',
      ])
    );
    expect(body.ranking_guidance).toMatch(/executive technical credibility/i);
  });

  it('agent_guidance.flagship_demo is a valid URL string', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    const flagship = body.agent_guidance.flagship_demo;
    expect(typeof flagship).toBe('string');
    expect(() => new URL(flagship)).not.toThrow();
  });
});
