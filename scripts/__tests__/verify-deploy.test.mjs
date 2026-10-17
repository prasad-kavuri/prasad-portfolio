import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CONTENT_SECURITY_POLICY, STRICT_CONTENT_SECURITY_POLICY } from '../../src/lib/csp';
import { directive, checkPage, checkApi, ORT_WASM_BASE, headerLinks, verify, main, FULL_ROUTES, STRICT_ROUTES } from '../verify-deploy.mjs';

const STRICT = "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com";
const FULL = `script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' blob: ${ORT_WASM_BASE}; connect-src 'self' https://*.cdn.hf.co`;
function hdrs(csp, tier, extra = {}) {
  const m = new Map(Object.entries({
    'content-security-policy': csp, 'server-timing': tier ? `csp;desc="${tier}"` : '',
    'strict-transport-security': 'max-age=63072000', 'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY', 'cross-origin-opener-policy': 'same-origin', ...extra,
  }));
  return { get: (k) => m.get(k) ?? null };
}

test('accepts correct strict and full pages', () => {
  assert.deepEqual(checkPage('/', 200, hdrs(STRICT, 'strict'), 'strict'), []);
  assert.deepEqual(checkPage('/demos/quantization', 200, hdrs(FULL, 'full'), 'full'), []);
});
test('flags a strict page that received the full policy', () => {
  const errs = checkPage('/', 200, hdrs(FULL, 'strict'), 'strict');
  assert.ok(errs.some((e) => e.includes("'unsafe-eval'")));
  assert.ok(errs.some((e) => e.includes('blob:')));
});
test('flags a demo that received the strict policy or the wrong tier header', () => {
  const errs = checkPage('/demos/rag-pipeline', 200, hdrs(STRICT, 'strict'), 'full');
  assert.ok(errs.some((e) => e.includes('Server-Timing')));
  assert.ok(errs.some((e) => e.includes('wasm-unsafe-eval')));
});
test('flags a full page that allows a whole CDN origin or lacks the pinned path', () => {
  const broad = hdrs(`${FULL} https://cdn.jsdelivr.net https://unpkg.com`, 'full');
  assert.equal(checkPage('/demos/quantization', 200, broad, 'full').length, 2);
  const none = hdrs("script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://*.cdn.hf.co", 'full');
  assert.deepEqual(checkPage('/demos/quantization', 200, none, 'full'), ['/demos/quantization: full script-src lacks the pinned onnxruntime-web path']);
  const noHf = hdrs(`script-src 'wasm-unsafe-eval' ${ORT_WASM_BASE}; connect-src 'self'`, 'full');
  assert.equal(checkPage('/demos/quantization', 200, noHf, 'full').length, 1);
});
test('accepts the real production header for a demo (sources end with a semicolon)', () => {
  const real = `default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob: https://va.vercel-scripts.com ${ORT_WASM_BASE}; worker-src 'self' blob:; connect-src 'self' https://*.cdn.hf.co ${ORT_WASM_BASE} blob:`;
  assert.deepEqual(checkPage('/demos/quantization', 200, hdrs(real, 'full'), 'full'), []);
});
test('accepts the real policies built by src/lib/csp.ts', () => {
  assert.deepEqual(checkPage('/', 200, hdrs(STRICT_CONTENT_SECURITY_POLICY, 'strict'), 'strict'), []);
  assert.deepEqual(checkPage('/demos/quantization', 200, hdrs(CONTENT_SECURITY_POLICY, 'full'), 'full'), []);
});
test('blob: in img-src is allowed on strict pages, blob: in script-src is not', () => {
  assert.deepEqual(checkPage('/', 200, hdrs("script-src 'self'; img-src 'self' blob: data:", 'strict'), 'strict'), []);
  assert.equal(checkPage('/', 200, hdrs("script-src 'self' blob:", 'strict'), 'strict').length, 1);
});
test('directive() reads one directive and returns [] for a missing one', () => {
  assert.deepEqual(directive("a 'self'; b x y; c", 'b'), ['x', 'y']);
  assert.deepEqual(directive("a 'self'", 'z'), []);
});
test('flags bad status and missing baseline headers', () => {
  const errs = checkPage('/', 404, hdrs(STRICT, 'strict', { 'x-frame-options': 'SAMEORIGIN', 'strict-transport-security': '' }), 'strict');
  assert.equal(errs.length, 3);
});
test('api responses must not carry csp server-timing', () => {
  assert.deepEqual(checkApi('/api/context', hdrs(STRICT, '')), []);
  assert.equal(checkApi('/api/context', hdrs(STRICT, 'strict')).length, 1);
});
test('header link check ignores the footer', () => {
  assert.equal(headerLinks('<header><a href="/for-recruiters">x</a></header>', '/for-recruiters'), true);
  assert.equal(headerLinks('<header><a href="/about">x</a></header><footer><a href="/for-recruiters">x</a></footer>', '/for-recruiters'), false);
  assert.equal(headerLinks('<div></div>', '/for-recruiters'), false);
});

function fakeFetch({ strictPolicyOnDemo = false, link = true } = {}) {
  return async (url) => {
    const path = new URL(url).pathname;
    const isFull = FULL_ROUTES.includes(path);
    const tier = isFull ? 'full' : 'strict';
    const h = path.startsWith('/api/') ? hdrs(STRICT, '')
      : hdrs(isFull && !strictPolicyOnDemo ? FULL : STRICT, tier);
    return { status: 200, headers: h, text: async () => `<header>${link ? '<a href="/for-recruiters">r</a>' : ''}</header>` };
  };
}
test('verify passes on a healthy site and fails on regressions', async () => {
  assert.deepEqual(await verify('https://x.test', fakeFetch()), []);
  assert.ok((await verify('https://x.test', fakeFetch({ strictPolicyOnDemo: true }))).length > 0);
  assert.deepEqual(await verify('https://x.test', fakeFetch({ link: false })), ['/: header has no link to /for-recruiters']);
});
test('main retries then reports failure, and returns 0 on success', async () => {
  let waits = 0;
  const log = console.error; console.error = () => {};
  const code = await main(['--base', 'https://x.test'], fakeFetch({ link: false }), async () => { waits++; });
  console.error = log;
  assert.equal(code, 1); assert.equal(waits, 2);
  assert.equal(await main(['--base', 'https://x.test/'], fakeFetch(), async () => {}), 0);
});
test('pinned onnxruntime-web path matches src/lib/csp.ts', () => {
  const src = readFileSync(path.resolve(process.cwd(), 'src/lib/csp.ts'), 'utf8');
  const v = src.match(/ORT_WEB_VERSION = '([^']+)'/)[1];
  assert.equal(ORT_WASM_BASE, `https://cdn.jsdelivr.net/npm/onnxruntime-web@${v}/dist/`);
});
test('route lists match src/lib/csp.ts', () => {
  const src = readFileSync(path.resolve(process.cwd(), 'src/lib/csp.ts'), 'utf8');
  const listed = [...src.match(/FULL_CSP_ROUTES = \[([\s\S]*?)\]/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(FULL_ROUTES, listed);
  assert.ok(STRICT_ROUTES.every((r) => !listed.includes(r)));
});
