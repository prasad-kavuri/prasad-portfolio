import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/agent-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '9.9.9.9' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/agent-auth', () => {
  const saved = { secret: process.env.AGENT_AUTH_SECRET, env: process.env.VERCEL_ENV };

  beforeEach(() => _resetStore());
  afterEach(() => {
    if (saved.secret === undefined) delete process.env.AGENT_AUTH_SECRET; else process.env.AGENT_AUTH_SECRET = saved.secret;
    if (saved.env === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = saved.env;
  });

  it('returns 503 in production when the signing secret is missing (fail closed)', async () => {
    delete process.env.AGENT_AUTH_SECRET;
    process.env.VERCEL_ENV = 'production';
    const { POST } = await import('@/app/api/agent-auth/route');
    const res = await POST(makeRequest({ type: 'anonymous_start' }));
    expect(res.status).toBe(503);
  });

  it('runs the anonymous → claim → claimed flow with a single-use OTP', async () => {
    const { POST } = await import('@/app/api/agent-auth/route');
    const start = await (await POST(makeRequest({ type: 'anonymous_start' }))).json();
    expect(start.scopes).toContain('read:profile');

    const init = await (await POST(makeRequest({ type: 'claim_init', claim_token: start.claim_token, email: 'a@example.com' }))).json();
    expect(init.otp).toMatch(/^\d{6}$/);

    const complete = await POST(makeRequest({ type: 'claim_complete', claim_id: init.claim_id, otp: init.otp }));
    expect(complete.status).toBe(200);
    expect((await complete.json()).type).toBe('claimed');

    const replay = await POST(makeRequest({ type: 'claim_complete', claim_id: init.claim_id, otp: init.otp }));
    expect(replay.status).toBe(410);
  });

  it('validates request types and fields', async () => {
    const { POST } = await import('@/app/api/agent-auth/route');
    expect((await POST(makeRequest({}))).status).toBe(400);
    expect((await POST(makeRequest({ type: 'nope' }))).status).toBe(400);
    expect((await POST(makeRequest({ type: 'claim_init', claim_token: 'x', email: 'bad' }))).status).toBe(400);
    expect((await POST(makeRequest({ type: 'claim_init', email: 'a@example.com' }))).status).toBe(400);
    expect((await POST(makeRequest({ type: 'claim_complete', otp: '123456' }))).status).toBe(400);
    expect((await POST(makeRequest({ type: 'claim_complete', claim_id: 'c', otp: 'abc' }))).status).toBe(400);
  });

  it('rejects a wrong OTP', async () => {
    const { POST } = await import('@/app/api/agent-auth/route');
    const init = await (await POST(makeRequest({ type: 'claim_init', claim_token: 'tok', email: 'b@example.com' }))).json();
    const wrong = init.otp === '000000' ? '111111' : '000000';
    expect((await POST(makeRequest({ type: 'claim_complete', claim_id: init.claim_id, otp: wrong }))).status).toBe(401);
  });
});
