import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { _resetDurableStore } from '@/lib/durable-store';
import { enforceDailyBudget, type RequestContext } from '@/lib/api';

function ctx(route: string, userHash?: string): RequestContext {
  return { route, method: 'POST', traceId: 'trace', startedAt: Date.now(), userHash };
}

describe('enforceDailyBudget', () => {
  const saved = { route: process.env.DAILY_LLM_CALL_CAP, client: process.env.DAILY_LLM_CALLS_PER_CLIENT };

  beforeEach(() => _resetDurableStore());
  afterEach(() => {
    process.env.DAILY_LLM_CALL_CAP = saved.route;
    process.env.DAILY_LLM_CALLS_PER_CLIENT = saved.client;
  });

  it('pauses a route with 503 once its daily cap is reached', async () => {
    process.env.DAILY_LLM_CALL_CAP = '2';
    process.env.DAILY_LLM_CALLS_PER_CLIENT = '100';
    expect(await enforceDailyBudget(ctx('/api/a', 'u1'))).toBeNull();
    expect(await enforceDailyBudget(ctx('/api/a', 'u2'))).toBeNull();
    const paused = await enforceDailyBudget(ctx('/api/a', 'u3'));
    expect(paused?.status).toBe(503);
    expect((await paused!.json()).error).toMatch(/paused for today/i);
    // Caps are per route
    expect(await enforceDailyBudget(ctx('/api/b', 'u3'))).toBeNull();
  });

  it('limits a single client across routes with 429 so one caller cannot drain the budget', async () => {
    process.env.DAILY_LLM_CALL_CAP = '100';
    process.env.DAILY_LLM_CALLS_PER_CLIENT = '1';
    expect(await enforceDailyBudget(ctx('/api/a', 'same'))).toBeNull();
    const limited = await enforceDailyBudget(ctx('/api/b', 'same'));
    expect(limited?.status).toBe(429);
  });

  it('falls back to defaults for invalid env values and skips the client cap without a client hash', async () => {
    process.env.DAILY_LLM_CALL_CAP = 'not-a-number';
    process.env.DAILY_LLM_CALLS_PER_CLIENT = '0';
    expect(await enforceDailyBudget(ctx('/api/c'))).toBeNull();
  });
});
