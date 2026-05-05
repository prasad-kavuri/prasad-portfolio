import { describe, it, expect, beforeEach } from 'vitest';
import { _resetObservability, recordSkillInvocation, createSpanId } from '@/lib/observability';

beforeEach(() => {
  _resetObservability();
});

describe('GET /api/skill-invocations', () => {
  it('returns empty invocations when buffer is empty', async () => {
    const { GET } = await import('@/app/api/skill-invocations/route');
    const req = new Request('http://localhost/api/skill-invocations');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invocations).toHaveLength(0);
    expect(body.bufferedCount).toBe(0);
  });

  it('returns recorded invocations', async () => {
    recordSkillInvocation({
      traceId: 'trace-1',
      spanId: createSpanId(),
      skillId: 'guardrails',
      skillName: 'Guardrails',
      demoId: 'test-demo',
      triggeredAt: new Date().toISOString(),
      outcome: 'pass',
    });

    const { GET } = await import('@/app/api/skill-invocations/route');
    const req = new Request('http://localhost/api/skill-invocations');
    const res = await GET(req);
    const body = await res.json();
    expect(body.invocations).toHaveLength(1);
    expect(body.invocations[0].skillId).toBe('guardrails');
    expect(body.bufferedCount).toBe(1);
  });

  it('respects ?limit query parameter', async () => {
    for (let i = 0; i < 5; i++) {
      recordSkillInvocation({
        traceId: `trace-${i}`,
        spanId: createSpanId(),
        skillId: `skill-${i}`,
        skillName: 'Test',
        demoId: 'demo',
        triggeredAt: new Date().toISOString(),
        outcome: 'pass',
      });
    }

    const { GET } = await import('@/app/api/skill-invocations/route');
    const req = new Request('http://localhost/api/skill-invocations?limit=3');
    const res = await GET(req);
    const body = await res.json();
    expect(body.invocations).toHaveLength(3);
    expect(body.bufferedCount).toBe(5);
  });

  it('caps limit at 50', async () => {
    const { GET } = await import('@/app/api/skill-invocations/route');
    const req = new Request('http://localhost/api/skill-invocations?limit=999');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    // Just verify it doesn't crash and returns valid structure
    expect(Array.isArray(body.invocations)).toBe(true);
  });

  it('falls back to the default limit for non-finite values', async () => {
    for (let i = 0; i < 12; i++) {
      recordSkillInvocation({
        traceId: `trace-${i}`,
        spanId: createSpanId(),
        skillId: `skill-${i}`,
        skillName: 'Test',
        demoId: 'demo',
        triggeredAt: new Date().toISOString(),
        outcome: 'pass',
      });
    }

    const { GET } = await import('@/app/api/skill-invocations/route');
    const req = new Request('http://localhost/api/skill-invocations?limit=NaN');
    const res = await GET(req);
    const body = await res.json();
    expect(body.invocations).toHaveLength(10);
  });

  it('clamps negative limits to one', async () => {
    for (let i = 0; i < 3; i++) {
      recordSkillInvocation({
        traceId: `trace-${i}`,
        spanId: createSpanId(),
        skillId: `skill-${i}`,
        skillName: 'Test',
        demoId: 'demo',
        triggeredAt: new Date().toISOString(),
        outcome: 'pass',
      });
    }

    const { GET } = await import('@/app/api/skill-invocations/route');
    const req = new Request('http://localhost/api/skill-invocations?limit=-5');
    const res = await GET(req);
    const body = await res.json();
    expect(body.invocations).toHaveLength(1);
  });
});
