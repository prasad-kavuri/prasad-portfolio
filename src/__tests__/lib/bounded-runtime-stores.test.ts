import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('bounded local runtime stores', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T00:00:00Z'));
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('fails closed on rate-limit capacity without evicting active limits', async () => {
    const { rateLimit, LOCAL_RATE_LIMIT_CAPACITY, RATE_LIMIT_MAX } = await import('@/lib/rate-limit');
    for (let i = 0; i < LOCAL_RATE_LIMIT_CAPACITY; i++) {
      expect((await rateLimit(`client-${i}`)).limited).toBe(false);
    }
    for (let i = 0; i < 10; i++) expect((await rateLimit(`overflow-${i}`)).limited).toBe(true);
    for (let i = 1; i < RATE_LIMIT_MAX; i++) expect((await rateLimit('client-0')).limited).toBe(false);
    expect((await rateLimit('client-0')).limited).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect((await rateLimit('new-client')).limited).toBe(false);
    expect((await rateLimit('client-0')).remaining).toBe(RATE_LIMIT_MAX - 1);
  });

  it('resets an existing local rate window exactly at expiry', async () => {
    const { rateLimit, RATE_LIMIT_MAX } = await import('@/lib/rate-limit');
    for (let i = 0; i < RATE_LIMIT_MAX; i++) await rateLimit('client');
    vi.advanceTimersByTime(59_999);
    expect((await rateLimit('client')).limited).toBe(true);
    vi.advanceTimersByTime(1);
    expect((await rateLimit('client')).limited).toBe(false);
  });

  it('fails closed on cost-control capacity and reclaims expired windows', async () => {
    const { enforceCostControls, LOCAL_COST_CONTROL_CAPACITY, MAX_COST_REQUESTS_PER_MINUTE } = await import('@/lib/cost-control');
    const request = (userKey: string) => enforceCostControls({ route: '/test', userKey, prompt: 'hello' });
    for (let i = 0; i < LOCAL_COST_CONTROL_CAPACITY; i++) expect(request(`client-${i}`).allowed).toBe(true);
    for (let i = 0; i < 10; i++) expect(request(`overflow-${i}`)).toMatchObject({ allowed: false, reason: 'request_frequency' });
    for (let i = 1; i < MAX_COST_REQUESTS_PER_MINUTE; i++) expect(request('client-0').allowed).toBe(true);
    expect(request('client-0').allowed).toBe(false);
    vi.advanceTimersByTime(60_000);
    expect(request('new-client').allowed).toBe(true);
    expect(request('client-0').allowed).toBe(true);
  });

  it('resets an existing cost window exactly at expiry', async () => {
    const { enforceCostControls, MAX_COST_REQUESTS_PER_MINUTE } = await import('@/lib/cost-control');
    const request = () => enforceCostControls({ route: '/test', userKey: 'client', prompt: 'hello' });
    for (let i = 0; i < MAX_COST_REQUESTS_PER_MINUTE; i++) request();
    vi.advanceTimersByTime(59_999);
    expect(request().allowed).toBe(false);
    vi.advanceTimersByTime(1);
    expect(request().allowed).toBe(true);
  });

  it('evicts only advisory history when anomaly identity capacity is exceeded', async () => {
    const { detectUsageAnomaly, ANOMALY_IDENTITY_CAPACITY } = await import('@/lib/observability');
    for (let i = 0; i < 12; i++) detectUsageAnomaly('/test', 500, 'oldest');
    for (let i = 1; i <= ANOMALY_IDENTITY_CAPACITY; i++) detectUsageAnomaly('/test', 500, `client-${i}`);
    expect(detectUsageAnomaly('/test', 500, 'oldest')).toEqual({ anomaly: false, reasons: [] });
    expect(detectUsageAnomaly('/test', 500, `client-${ANOMALY_IDENTITY_CAPACITY}`).anomaly).toBe(false);
    expect(detectUsageAnomaly('/test', 500, `client-${ANOMALY_IDENTITY_CAPACITY}`).reasons).toContain('repeated_failures');
  });

  it('preserves anomaly detection under sustained traffic and ages history out', async () => {
    const { detectUsageAnomaly } = await import('@/lib/observability');
    for (let i = 0; i < 10_000; i++) detectUsageAnomaly('/test', 500, 'busy');
    expect(detectUsageAnomaly('/test', 500, 'busy').reasons).toEqual(['high_request_frequency', 'repeated_failures']);
    vi.advanceTimersByTime(60_001);
    expect(detectUsageAnomaly('/test', 500, 'busy')).toEqual({ anomaly: false, reasons: [] });
  });
});
