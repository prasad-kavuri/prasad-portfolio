import { describe, it, expect, vi, afterEach } from 'vitest';
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
});
