import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  CLAIM_TTL_S,
  CLAIMED_TTL_S,
  DEMO_SCOPES,
  generateOtp,
  generateRandomHex,
  issueToken,
  popClaimEntry,
  storeClaimEntry,
  verifyToken,
} from '@/lib/agent-auth';

describe('agent auth utilities', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('issues and verifies anonymous tokens with demo scopes', async () => {
    vi.setSystemTime(new Date('2026-06-11T00:00:00.000Z'));

    const token = await issueToken(
      {
        sub: 'agent:anonymous:test',
        type: 'anonymous',
        scopes: DEMO_SCOPES,
      },
      CLAIM_TTL_S,
    );

    const payload = await verifyToken(token);

    expect(token.split('.')).toHaveLength(2);
    expect(payload).toEqual({
      sub: 'agent:anonymous:test',
      type: 'anonymous',
      scopes: DEMO_SCOPES,
      iat: 1781136000,
      exp: 1781136000 + CLAIM_TTL_S,
    });
  });

  it('issues claimed tokens with email identity', async () => {
    const token = await issueToken(
      {
        sub: 'agent:claimed:test@example.com',
        type: 'claimed',
        scopes: DEMO_SCOPES,
        email: 'test@example.com',
      },
      CLAIMED_TTL_S,
    );

    const payload = await verifyToken(token);

    expect(payload).toMatchObject({
      sub: 'agent:claimed:test@example.com',
      type: 'claimed',
      scopes: DEMO_SCOPES,
      email: 'test@example.com',
    });
    expect(payload?.exp).toBeGreaterThan(payload?.iat ?? 0);
  });

  it('rejects malformed, tampered, and expired tokens', async () => {
    vi.setSystemTime(new Date('2026-06-11T00:00:00.000Z'));
    const token = await issueToken(
      {
        sub: 'agent:anonymous:expired',
        type: 'anonymous',
        scopes: DEMO_SCOPES,
      },
      1,
    );

    expect(await verifyToken('missing-dot')).toBeNull();
    expect(await verifyToken(`${token}tampered`)).toBeNull();

    vi.setSystemTime(new Date('2026-06-11T00:00:02.000Z'));
    expect(await verifyToken(token)).toBeNull();
  });

  it('stores and consumes claim entries once', async () => {
    const claimId = `claim-${generateRandomHex(4)}`;
    const entry = {
      otp: '123456',
      email: 'candidate@example.com',
      anonToken: 'anon-token',
      expiresAt: Date.now() + 60_000,
    };

    await storeClaimEntry(claimId, entry);

    expect(await popClaimEntry(claimId)).toEqual(entry);
    expect(await popClaimEntry(claimId)).toBeNull();
  });

  it('prunes expired local claim entries during writes', async () => {
    const expiredClaimId = `expired-${generateRandomHex(4)}`;
    const activeClaimId = `active-${generateRandomHex(4)}`;

    await storeClaimEntry(expiredClaimId, {
      otp: '111111',
      email: 'old@example.com',
      anonToken: 'old-token',
      expiresAt: Date.now() - 1,
    });
    await storeClaimEntry(activeClaimId, {
      otp: '222222',
      email: 'new@example.com',
      anonToken: 'new-token',
      expiresAt: Date.now() + 60_000,
    });

    expect(await popClaimEntry(expiredClaimId)).toBeNull();
    expect(await popClaimEntry(activeClaimId)).toMatchObject({
      otp: '222222',
      email: 'new@example.com',
    });
  });

  it('generates hex identifiers and six-digit OTPs', () => {
    const hex = generateRandomHex(8);
    const otp = generateOtp();

    expect(hex).toMatch(/^[a-f0-9]{16}$/);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it.each([
    ['development', undefined, true],
    ['test', undefined, true],
    ['development', 'development', true],
    ['production', undefined, false],
    ['production', 'production', false],
    ['test', 'preview', false],
    ['development', 'production', false],
    [undefined, undefined, false],
  ] as const)('limits development signing for NODE_ENV=%s VERCEL_ENV=%s', async (nodeEnv, vercelEnv, allowed) => {
    vi.stubEnv('NODE_ENV', nodeEnv);
    vi.stubEnv('VERCEL_ENV', vercelEnv);
    vi.stubEnv('AGENT_AUTH_SECRET', undefined);
    const { isAgentAuthConfigured, AgentAuthConfigError } = await import('@/lib/agent-auth');
    expect(isAgentAuthConfigured()).toBe(allowed);
    const issued = issueToken({ sub: 'test-agent', type: 'anonymous', scopes: [] }, 60);
    if (allowed) expect(await verifyToken(await issued)).not.toBeNull();
    else await expect(issued).rejects.toBeInstanceOf(AgentAuthConfigError);
  });

  it('requires a nonblank secret in production but preserves configured secret bytes', async () => {
    const { isAgentAuthConfigured } = await import('@/lib/agent-auth');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', undefined);
    vi.stubEnv('AGENT_AUTH_SECRET', '   ');
    expect(isAgentAuthConfigured()).toBe(false);
    vi.stubEnv('AGENT_AUTH_SECRET', ' configured-test-secret ');
    expect(isAgentAuthConfigured()).toBe(true);
    const token = await issueToken({ sub: 'test-agent', type: 'anonymous', scopes: [] }, 60);
    expect(await verifyToken(token)).not.toBeNull();
    vi.stubEnv('AGENT_AUTH_SECRET', 'configured-test-secret');
    expect(await verifyToken(token)).toBeNull();
  });

  it('accepts a token before expiry and rejects it exactly at expiry', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T00:00:00Z'));
    const token = await issueToken({ sub: 'test-agent', type: 'anonymous', scopes: [] }, 60);
    vi.advanceTimersByTime(59000);
    expect(await verifyToken(token)).not.toBeNull();
    vi.advanceTimersByTime(1000);
    expect(await verifyToken(token)).toBeNull();
  });

  it.each([
    null, [], {}, { sub: '' }, { sub: ' ' }, { sub: 'x'.repeat(513) },
    { type: 'admin' }, { scopes: 'read:profile' }, { scopes: [42] },
    { scopes: [''] }, { scopes: [' '] }, { scopes: ['x'.repeat(129)] },
    { scopes: Array(33).fill('read:profile') }, { email: 42 }, { email: '' },
    { email: 'x'.repeat(255) }, { iat: -1 }, { iat: 1.5 },
    { exp: 'never' }, { exp: null }, { exp: 1.5 }, { exp: Number.MAX_SAFE_INTEGER + 1 },
    { iat: 1792800001 }, { exp: 1792800000 },
  ])('rejects malformed claims even with a valid signature: %j', async (changes) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T00:00:00Z'));
    vi.stubEnv('AGENT_AUTH_SECRET', 'independent-auth-test-key');
    const valid = { sub: 'test-agent', type: 'anonymous', scopes: ['read:profile'], iat: 1792800000, exp: 1792800060 };
    const payload = changes === null || Array.isArray(changes) ? changes : Object.keys(changes).length ? { ...valid, ...changes } : {};
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', 'independent-auth-test-key').update(encoded).digest('base64url');
    expect(await verifyToken(`${encoded}.${signature}`)).toBeNull();
  });

  it('rejects oversized credentials before processing', async () => {
    expect(await verifyToken('x'.repeat(8193))).toBeNull();
  });

  it('fails closed in production when AGENT_AUTH_SECRET is missing', async () => {
    const { AgentAuthConfigError, isAgentAuthConfigured } = await import('@/lib/agent-auth');
    const saved = { secret: process.env.AGENT_AUTH_SECRET, env: process.env.VERCEL_ENV };
    delete process.env.AGENT_AUTH_SECRET;
    process.env.VERCEL_ENV = 'production';
    try {
      expect(isAgentAuthConfigured()).toBe(false);
      await expect(issueToken({ sub: 's', type: 'anonymous', scopes: DEMO_SCOPES }, 60)).rejects.toBeInstanceOf(AgentAuthConfigError);
    } finally {
      if (saved.secret === undefined) delete process.env.AGENT_AUTH_SECRET; else process.env.AGENT_AUTH_SECRET = saved.secret;
      if (saved.env === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = saved.env;
    }
  });

  it('signs with AGENT_AUTH_SECRET when set, so tokens from another secret do not verify', async () => {
    const saved = process.env.AGENT_AUTH_SECRET;
    process.env.AGENT_AUTH_SECRET = 'secret-a';
    try {
      const token = await issueToken({ sub: 's', type: 'anonymous', scopes: DEMO_SCOPES }, 60);
      expect(await verifyToken(token)).not.toBeNull();
      process.env.AGENT_AUTH_SECRET = 'secret-b';
      expect(await verifyToken(token)).toBeNull();
      expect(await verifyToken(`${token}x`)).toBeNull();
    } finally {
      if (saved === undefined) delete process.env.AGENT_AUTH_SECRET; else process.env.AGENT_AUTH_SECRET = saved;
    }
  });
});
