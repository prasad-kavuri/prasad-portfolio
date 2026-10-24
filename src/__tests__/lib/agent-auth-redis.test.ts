import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ values: new Map<string, unknown>(), getdel: vi.fn() }));
vi.mock('@upstash/redis', () => ({
  Redis: class {
    async set(key: string, value: unknown) { state.values.set(key, value); }
    getdel = state.getdel;
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test.upstash.io');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
  state.values.clear();
  state.getdel.mockReset().mockImplementation(async (key: string) => {
    const value = state.values.get(key) ?? null;
    state.values.delete(key);
    return value;
  });
});
afterEach(() => vi.unstubAllEnvs());

it('uses one atomic GETDEL so concurrent claims cannot consume the same OTP twice', async () => {
  const { storeClaimEntry, popClaimEntry } = await import('@/lib/agent-auth');
  const entry = { otp: '123456', email: 'example@example.com', anonToken: 'synthetic', expiresAt: Date.now() + 60000 };
  await storeClaimEntry('claim', entry);
  const results = await Promise.all([popClaimEntry('claim'), popClaimEntry('claim')]);
  expect(results).toEqual([entry, null]);
  expect(state.getdel).toHaveBeenCalledWith('agent-auth:claim:claim');
});

it('accepts deserialized Redis values and propagates backend failures', async () => {
  const { popClaimEntry } = await import('@/lib/agent-auth');
  const entry = { otp: '123456', email: 'example@example.com', anonToken: 'synthetic', expiresAt: Date.now() + 60000 };
  state.values.set('agent-auth:claim:parsed', entry);
  expect(await popClaimEntry('parsed')).toEqual(entry);
  state.getdel.mockRejectedValueOnce(new Error('backend unavailable'));
  await expect(popClaimEntry('claim')).rejects.toThrow('backend unavailable');
});
