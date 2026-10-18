#!/usr/bin/env node
// Model health check (SPEC-0033). Confirms every Groq model in src/lib/groq-models.ts is still listed and still
// answers a one-line prompt, so a retirement or plan change is noticed before a visitor hits it.
// Needs GROQ_API_KEY in the environment (a GitHub secret in CI). Never prints the key or response bodies.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const API = 'https://api.groq.com/openai/v1';
const SAFE_CODE = /^[a-z0-9_]{1,64}$/;

/** Model ids declared in groq-models.ts (every id has an org/name shape). */
export function catalogIds(source) {
  return [...source.matchAll(/\bid:\s*'([^'/]+\/[^']+)'/g)].map((m) => m[1]);
}

/** Same rule as isModelUnavailable in src/lib/groq-models.ts. */
export function isUnavailable(status, code) {
  if (status === 404) return true;
  return (status === 400 || status === 403) && typeof code === 'string' && code.startsWith('model_');
}

async function errorCode(res) {
  try {
    const code = (await res.json())?.error?.code;
    return typeof code === 'string' && SAFE_CODE.test(code) ? code : null;
  } catch {
    return null;
  }
}

/** One model: { id, result: 'ok' | 'fail' | 'inconclusive', detail }. */
export async function checkModel(id, key, fetchFn = fetch) {
  const body = {
    model: id,
    messages: [{ role: 'user', content: 'Reply with the single word OK.' }],
    max_completion_tokens: 64,
    ...(id.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low', include_reasoning: false } : {}),
  };
  let res;
  try {
    res = await fetchFn(`${API}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    return { id, result: 'inconclusive', detail: `request failed (${error instanceof Error ? error.name : 'error'})` };
  }
  if (res.ok) return { id, result: 'ok', detail: 'answered' };
  if (res.status === 429) return { id, result: 'inconclusive', detail: 'rate limited (429)' };
  const code = await errorCode(res);
  if (isUnavailable(res.status, code)) return { id, result: 'fail', detail: `unavailable (${res.status}${code ? ` ${code}` : ''})` };
  return { id, result: 'fail', detail: `unexpected ${res.status}${code ? ` ${code}` : ''}` };
}

export async function main(env = process.env, fetchFn = fetch, log = console, source) {
  const key = env.GROQ_API_KEY;
  if (!key) {
    log.log('::warning::GROQ_API_KEY is not set, so the model health check was skipped. Add it as a repository secret.');
    return 0;
  }
  const ids =
    catalogIds(source ?? readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/groq-models.ts'), 'utf8'));
  if (ids.length === 0) {
    log.error('No model ids found in src/lib/groq-models.ts.');
    return 1;
  }

  let listed = null;
  try {
    const res = await fetchFn(`${API}/models`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20000) });
    if (res.ok) listed = new Set(((await res.json())?.data ?? []).map((m) => m.id));
    else log.log(`::warning::Model list returned ${res.status}; checking each model directly.`);
  } catch {
    log.log('::warning::Model list request failed; checking each model directly.');
  }

  let failed = 0;
  for (const id of ids) {
    if (listed && !listed.has(id)) {
      log.error(`FAIL ${id}: not in Groq's model list`);
      failed += 1;
      continue;
    }
    const r = await checkModel(id, key, fetchFn);
    if (r.result === 'fail') {
      log.error(`FAIL ${id}: ${r.detail}`);
      failed += 1;
    } else if (r.result === 'inconclusive') {
      log.log(`::warning::${id}: ${r.detail}, not counted as a failure`);
    } else {
      log.log(`ok   ${id}: ${r.detail}`);
    }
  }
  return failed === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main());
}
