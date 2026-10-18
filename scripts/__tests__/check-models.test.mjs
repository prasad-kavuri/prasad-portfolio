import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { catalogIds, isUnavailable, checkModel, main } from '../check-models.mjs';
import { MODEL_IDS } from '../../src/lib/groq-models';

const json = (status, body) => new Response(JSON.stringify(body), { status });
const quietLog = () => ({ out: [], log(m) { this.out.push(m); }, error(m) { this.out.push(m); } });

test('catalog ids parsed from groq-models.ts equal the exported MODEL_IDS', () => {
  const source = readFileSync(path.resolve(process.cwd(), 'src/lib/groq-models.ts'), 'utf8');
  assert.deepEqual(catalogIds(source), [...MODEL_IDS]);
});

test('unavailable rule matches the app', () => {
  assert.equal(isUnavailable(404, null), true);
  assert.equal(isUnavailable(400, 'model_decommissioned'), true);
  assert.equal(isUnavailable(403, 'model_permission_blocked_org'), true);
  assert.equal(isUnavailable(401, 'invalid_api_key'), false);
  assert.equal(isUnavailable(400, 'invalid_request'), false);
});

test('checkModel: ok, retired, rate limited, auth failure, network error', async () => {
  assert.equal((await checkModel('openai/gpt-oss-20b', 'k', async () => json(200, {}))).result, 'ok');
  assert.equal((await checkModel('a/b', 'k', async () => json(400, { error: { code: 'model_decommissioned' } }))).result, 'fail');
  assert.equal((await checkModel('a/b', 'k', async () => json(429, {}))).result, 'inconclusive');
  const auth = await checkModel('a/b', 'k', async () => json(401, { error: { code: 'invalid_api_key' } }));
  assert.equal(auth.result, 'fail');
  assert.match(auth.detail, /unexpected 401/);
  assert.equal((await checkModel('a/b', 'k', async () => { throw new Error('x'); })).result, 'inconclusive');
});

test('checkModel sends reasoning controls only to gpt-oss and never the key in the body', async () => {
  const bodies = [];
  const f = async (_u, init) => { bodies.push(init.body); return json(200, {}); };
  await checkModel('openai/gpt-oss-120b', 'secret-key', f);
  await checkModel('qwen/qwen3.8-27b', 'secret-key', f);
  assert.match(bodies[0], /reasoning_effort/);
  assert.doesNotMatch(bodies[1], /reasoning_effort/);
  assert.doesNotMatch(bodies.join(' '), /secret-key/);
});

test('main skips with a warning when no key is set', async () => {
  const log = quietLog();
  assert.equal(await main({}, async () => { throw new Error('should not call'); }, log, "id: 'a/b'"), 0);
  assert.match(log.out[0], /::warning::GROQ_API_KEY is not set/);
});

test('main passes when every model is listed and answers', async () => {
  const f = async (url) => (url.endsWith('/models') ? json(200, { data: [{ id: 'a/b' }, { id: 'c/d' }] }) : json(200, {}));
  assert.equal(await main({ GROQ_API_KEY: 'k' }, f, quietLog(), "id: 'a/b', id: 'c/d'"), 0);
});

test('main fails when a model is missing from the list or retired', async () => {
  const missing = async (url) => (url.endsWith('/models') ? json(200, { data: [{ id: 'a/b' }] }) : json(200, {}));
  assert.equal(await main({ GROQ_API_KEY: 'k' }, missing, quietLog(), "id: 'a/b', id: 'c/d'"), 1);
  const retired = async (url) => (url.endsWith('/models') ? json(500, {}) : json(404, {}));
  assert.equal(await main({ GROQ_API_KEY: 'k' }, retired, quietLog(), "id: 'a/b'"), 1);
});

test('main does not fail on rate limiting and fails on an empty catalog', async () => {
  const limited = async (url) => (url.endsWith('/models') ? json(200, { data: [{ id: 'a/b' }] }) : json(429, {}));
  assert.equal(await main({ GROQ_API_KEY: 'k' }, limited, quietLog(), "id: 'a/b'"), 0);
  assert.equal(await main({ GROQ_API_KEY: 'k' }, limited, quietLog(), 'nothing'), 1);
  const down = async () => { throw new Error('offline'); };
  assert.equal(await main({ GROQ_API_KEY: 'k' }, down, quietLog(), "id: 'a/b'"), 0);
});
