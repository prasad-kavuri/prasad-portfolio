import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  CAPABLE_MODEL,
  CODE_MODEL,
  FAST_MODEL,
  MODEL_CATALOG,
  MODEL_IDS,
  callWithModelFallback,
  completionBudget,
  fallbackChain,
  fetchWithModelFallback,
  isModelUnavailable,
  modelById,
  reasoningParams,
  stripReasoning,
} from '@/lib/groq-models';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('catalog', () => {
  it('has unique ids and one model per tier', () => {
    expect(new Set(MODEL_IDS).size).toBe(MODEL_CATALOG.length);
    expect(MODEL_CATALOG.map((m) => m.tier).sort()).toEqual(['capable', 'code', 'fast']);
  });

  it('looks models up by id', () => {
    expect(modelById(FAST_MODEL.id)).toBe(FAST_MODEL);
    expect(modelById('nope')).toBeUndefined();
    expect(modelById(undefined)).toBeUndefined();
  });

  it('ends every chain on a production model', () => {
    for (const m of MODEL_CATALOG) {
      const chain = fallbackChain(m.id);
      expect(chain[0]).toBe(m.id);
      expect(modelById(chain[chain.length - 1])?.preview).toBe(false);
    }
    expect(fallbackChain(CODE_MODEL.id)).toEqual([CODE_MODEL.id, CAPABLE_MODEL.id]);
    expect(fallbackChain('unknown')).toEqual(['unknown']);
  });
});

describe('reasoning helpers', () => {
  it('asks gpt-oss for low, hidden reasoning and nothing for others', () => {
    expect(reasoningParams(CAPABLE_MODEL.id)).toEqual({ reasoning_effort: 'low', include_reasoning: false });
    expect(reasoningParams(CODE_MODEL.id)).toEqual({});
    expect(reasoningParams('unknown')).toEqual({});
  });

  it('gives reasoning models headroom, capped, and leaves others alone', () => {
    expect(completionBudget(CAPABLE_MODEL.id, 512)).toBe(1024);
    expect(completionBudget(CAPABLE_MODEL.id, 2000)).toBe(2048);
    expect(completionBudget('unknown', 512)).toBe(512);
  });

  it('strips think blocks', () => {
    expect(stripReasoning('<think>\nplan\n</think>\nAnswer')).toBe('Answer');
    expect(stripReasoning('plain')).toBe('plain');
  });
});

describe('isModelUnavailable', () => {
  it('flags 404 and model_ codes on 400/403 only', () => {
    expect(isModelUnavailable(404, null)).toBe(true);
    expect(isModelUnavailable(400, 'model_decommissioned')).toBe(true);
    expect(isModelUnavailable(403, 'model_permission_blocked_org')).toBe(true);
    expect(isModelUnavailable(400, 'invalid_request')).toBe(false);
    expect(isModelUnavailable(401, 'model_decommissioned')).toBe(false);
    expect(isModelUnavailable(429, null)).toBe(false);
    expect(isModelUnavailable(undefined, undefined)).toBe(false);
  });
});

describe('fetchWithModelFallback', () => {
  it('returns the first response when it succeeds', async () => {
    const send = vi.fn().mockResolvedValue(json(200, {}));
    const out = await fetchWithModelFallback(FAST_MODEL.id, send);
    expect(out.model).toBe(FAST_MODEL.id);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('moves to the next model on a decommissioned error and tells the caller', async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce(json(400, { error: { code: 'model_decommissioned' } }))
      .mockResolvedValueOnce(json(200, {}));
    const notice = vi.fn();
    const out = await fetchWithModelFallback(FAST_MODEL.id, send, notice);
    expect(out.model).toBe(CAPABLE_MODEL.id);
    expect(out.response.ok).toBe(true);
    expect(notice).toHaveBeenCalledWith(FAST_MODEL.id, CAPABLE_MODEL.id, 400);
  });

  it.each([
    [401, { error: { code: 'invalid_api_key' } }],
    [429, { error: { code: 'rate_limit_exceeded' } }],
    [400, { error: { code: 'invalid_request' } }],
    [400, 'not json'],
  ])('does not retry on %s', async (status, body) => {
    const send = vi.fn().mockResolvedValue(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));
    const out = await fetchWithModelFallback(FAST_MODEL.id, send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(out.response.status).toBe(status);
  });

  it('does not retry an id outside the catalog', async () => {
    const send = vi.fn().mockResolvedValue(json(404, {}));
    await fetchWithModelFallback('mystery', send);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('returns the last failure when the whole chain is unavailable', async () => {
    const send = vi.fn().mockImplementation(async () => json(404, { error: { code: 'model_not_found' } }));
    const out = await fetchWithModelFallback(FAST_MODEL.id, send);
    expect(send).toHaveBeenCalledTimes(2);
    expect(out.response.status).toBe(404);
    expect(out.model).toBe(CAPABLE_MODEL.id);
  });

  it('copes with a response that cannot be cloned', async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });
    const out = await fetchWithModelFallback(FAST_MODEL.id, send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(out.model).toBe(FAST_MODEL.id);
  });
});

describe('callWithModelFallback', () => {
  const retired = () => Object.assign(new Error('gone'), { status: 400, error: { error: { code: 'model_decommissioned' } } });

  it('retries on an SDK-style retired-model error', async () => {
    const call = vi.fn().mockRejectedValueOnce(retired()).mockResolvedValueOnce('ok');
    const notice = vi.fn();
    const out = await callWithModelFallback(CAPABLE_MODEL.id, call, notice);
    expect(out).toEqual({ result: 'ok', model: FAST_MODEL.id });
    expect(notice).toHaveBeenCalledWith(CAPABLE_MODEL.id, FAST_MODEL.id, 400);
  });

  it('also reads a code directly on the error', async () => {
    const err = Object.assign(new Error('x'), { status: 403, code: 'model_permission_blocked_project' });
    const call = vi.fn().mockRejectedValueOnce(err).mockResolvedValueOnce('ok');
    expect((await callWithModelFallback(CAPABLE_MODEL.id, call)).model).toBe(FAST_MODEL.id);
  });

  it('rethrows unrelated errors and non-errors without retrying', async () => {
    const call = vi.fn().mockRejectedValue(Object.assign(new Error('auth'), { status: 401 }));
    await expect(callWithModelFallback(CAPABLE_MODEL.id, call)).rejects.toThrow('auth');
    expect(call).toHaveBeenCalledTimes(1);
    const weird = vi.fn().mockRejectedValue('boom');
    await expect(callWithModelFallback(CAPABLE_MODEL.id, weird)).rejects.toBe('boom');
  });

  it('throws the last error when every model is unavailable', async () => {
    const call = vi.fn().mockRejectedValue(retired());
    await expect(callWithModelFallback(CAPABLE_MODEL.id, call)).rejects.toThrow('gone');
    expect(call).toHaveBeenCalledTimes(2);
  });
});

describe('retired model ids stay out of the source', () => {
  const RETIRED = ['llama-3.3-70b', 'llama-3.1-8b', 'llama-4-scout', 'qwen3-32b', 'mixtral'];

  // Simulated dashboard data that never calls an API (SPEC-0029 out of scope).
  const SIMULATED = ['enterpriseMockData.ts'];

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__') walk(full, out);
      } else if (/\.(ts|tsx)$/.test(entry.name) && !SIMULATED.includes(entry.name)) out.push(full);
    }
    return out;
  }

  it('does not mention a model Groq has retired', () => {
    const offenders: string[] = [];
    for (const file of walk(path.resolve(process.cwd(), 'src'))) {
      const text = fs.readFileSync(file, 'utf8').toLowerCase();
      for (const id of RETIRED) if (text.includes(id)) offenders.push(`${path.relative(process.cwd(), file)}: ${id}`);
    }
    expect(offenders).toEqual([]);
  });
});
