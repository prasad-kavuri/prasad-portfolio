import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CONTENT_SECURITY_POLICY, STRICT_CONTENT_SECURITY_POLICY } from '../../src/lib/csp';
import { directive, checkPage, checkApi, ORT_WASM_BASE, headerLinks, verify, main, FULL_ROUTES, STRICT_ROUTES, parseRobots, robotsAllows, checkRobots, checkTitles, checkSecurityTxt, pageTitle } from '../verify-deploy.mjs';

const STRICT = STRICT_CONTENT_SECURITY_POLICY;
const FULL = CONTENT_SECURITY_POLICY;
function hdrs(csp, tier, extra = {}) {
  const m = new Map(Object.entries({
    'content-security-policy': csp, 'server-timing': tier ? `csp;desc="${tier}"` : '',
    'strict-transport-security': 'max-age=63072000; includeSubDomains; preload', 'x-content-type-options': 'nosniff',
    'cross-origin-embedder-policy': 'credentialless',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()',
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
  const broad = hdrs(FULL.replace("script-src 'self'", "script-src 'self' https://cdn.jsdelivr.net https://unpkg.com"), 'full');
  assert.ok(checkPage('/demos/quantization', 200, broad, 'full').length >= 2);
  const none = hdrs("script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://*.cdn.hf.co", 'full');
  assert.ok(checkPage('/demos/quantization', 200, none, 'full').some((e) => e.includes('lacks the pinned')));
  const noHf = hdrs(`script-src 'wasm-unsafe-eval' ${ORT_WASM_BASE}; connect-src 'self'`, 'full');
  assert.ok(checkPage('/demos/quantization', 200, noHf, 'full').some((e) => e.includes('connect-src lacks')));
});
test('accepts the real production header for a demo (sources end with a semicolon)', () => {
  const real = `default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob: https://va.vercel-scripts.com ${ORT_WASM_BASE}; worker-src 'self' blob:; connect-src 'self' https://*.cdn.hf.co ${ORT_WASM_BASE} blob:`;
  assert.deepEqual(checkPage('/demos/quantization', 200, hdrs(FULL, 'full'), 'full'), []);
  assert.ok(directive(real, 'script-src').includes(ORT_WASM_BASE));
});
test('accepts the real policies built by src/lib/csp.ts', () => {
  assert.deepEqual(checkPage('/', 200, hdrs(STRICT_CONTENT_SECURITY_POLICY, 'strict'), 'strict'), []);
  assert.deepEqual(checkPage('/demos/quantization', 200, hdrs(CONTENT_SECURITY_POLICY, 'full'), 'full'), []);
});
test('blob: in img-src is allowed on strict pages, blob: in script-src is not', () => {
  assert.deepEqual(checkPage('/', 200, hdrs(STRICT, 'strict'), 'strict'), []);
  assert.ok(checkPage('/', 200, hdrs(STRICT.replace("script-src 'self'", "script-src 'self' blob:"), 'strict'), 'strict').some((e) => e.includes('blob:')));
});
test('directive() reads one directive and returns [] for a missing one', () => {
  assert.deepEqual(directive("a 'self'; b x y; c", 'b'), ['x', 'y']);
  assert.deepEqual(directive("a 'self'", 'z'), []);
});
test('flags bad status and missing baseline headers', () => {
  const errs = checkPage('/', 404, hdrs(STRICT, 'strict', { 'x-frame-options': 'SAMEORIGIN', 'strict-transport-security': '' }), 'strict');
  assert.equal(errs.length, 3);
});
test('rejects missing essential CSP directives and unrestricted code sources', () => {
  const errs = checkPage('/', 200, hdrs('script-src *; worker-src *; connect-src *', 'strict'), 'strict');
  assert.ok(errs.some((e) => e.includes('default-src')));
  assert.ok(errs.some((e) => e.includes('unrestricted')));
  for (const name of ['script-src', 'worker-src', 'connect-src']) {
    for (const source of ['*', 'https:', 'data:', 'https://*']) {
      const policy = STRICT.replace(`${name} 'self'`, `${name} 'self' ${source}`);
      assert.ok(checkPage('/', 200, hdrs(policy, 'strict'), 'strict').some((e) => e.includes('unrestricted')));
    }
  }
  assert.ok(checkPage('/', 200, hdrs(`${STRICT}; script-src 'self'`, 'strict'), 'strict').some((e) => e.includes('exactly one script-src')));
});
test('rejects disabled, short and ambiguous HSTS and missing isolation/permissions', () => {
  for (const value of ['max-age=0; includeSubDomains', 'max-age=300; includeSubDomains', 'max-age=63072000', 'max-age=63072000; max-age=0; includeSubDomains']) {
    assert.ok(checkPage('/', 200, hdrs(STRICT, 'strict', { 'strict-transport-security': value }), 'strict').some((e) => e.includes('HSTS')));
  }
  assert.ok(checkPage('/', 200, hdrs(STRICT, 'strict', { 'cross-origin-embedder-policy': '' }), 'strict').some((e) => e.includes('COEP')));
  assert.ok(checkPage('/', 200, hdrs(STRICT, 'strict', { 'permissions-policy': 'camera=(*)' }), 'strict').some((e) => e.includes('disable camera')));
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

const GOOD_ROBOTS = `User-agent: *
Allow: /
Allow: /api/resume-download
Allow: /api/mcp
Allow: /api/a2a
Allow: /api/context
Disallow: /api/

User-agent: GPTBot
Allow: /
Allow: /api/resume-download
Allow: /api/mcp
Allow: /api/a2a
Allow: /api/context
Disallow: /api/
`;
const BAD_ROBOTS = `User-agent: *
Allow: /
Disallow: /api/
`;
function fakeFetch({ strictPolicyOnDemo = false, link = true, robots = GOOD_ROBOTS, sameTitle = false, secType = 'text/plain; charset=utf-8', resumeRedirect = true } = {}) {
  return async (url) => {
    const path = new URL(url).pathname;
    if (path === '/robots.txt') return { status: 200, headers: hdrs('', ''), text: async () => robots };
    if (path === '/.well-known/security.txt') {
      return { status: 200, headers: new Map([['content-type', secType]]), text: async () => 'Contact: mailto:a@b.c\nExpires: 2030-01-01T00:00:00Z\n' };
    }
    if (path === '/resume') {
      return resumeRedirect
        ? { status: 307, headers: new Map([['location', '/api/resume-download']]), text: async () => '' }
        : { status: 404, headers: new Map(), text: async () => '' };
    }
    const isFull = FULL_ROUTES.includes(path);
    const tier = isFull ? 'full' : 'strict';
    const h = path.startsWith('/api/') ? hdrs(STRICT, '')
      : hdrs(isFull && !strictPolicyOnDemo ? FULL : STRICT, tier);
    return { status: 200, headers: h, text: async () => `<title>${sameTitle ? 'same' : 'Page ' + path}</title><header>${link ? '<a href="/for-recruiters">r</a>' : ''}</header>` };
  };
}
test('verify passes on a healthy site and fails on regressions', async () => {
  assert.deepEqual(await verify('https://x.test', fakeFetch()), []);
  assert.ok((await verify('https://x.test', fakeFetch({ strictPolicyOnDemo: true }))).length > 0);
  assert.deepEqual(await verify('https://x.test', fakeFetch({ link: false })), ['/: header has no link to /for-recruiters']);
});
test('verify flags robots, title, security.txt and resume regressions', async () => {
  assert.ok((await verify('https://x.test', fakeFetch({ robots: BAD_ROBOTS }))).some((e) => e.includes('/api/resume-download')));
  assert.ok((await verify('https://x.test', fakeFetch({ sameTitle: true }))).some((e) => e.includes('duplicates')));
  assert.ok((await verify('https://x.test', fakeFetch({ secType: 'application/json' }))).some((e) => e.includes('text/plain')));
  assert.ok((await verify('https://x.test', fakeFetch({ resumeRedirect: false }))).some((e) => e.startsWith('/resume')));
});
test('robots parsing: longest match wins and groups are separate', () => {
  const groups = parseRobots(GOOD_ROBOTS + '\n' + BAD_ROBOTS);
  assert.equal(groups.length, 3);
  assert.equal(robotsAllows(groups[0], '/api/mcp'), true);
  assert.equal(robotsAllows(groups[0], '/api/other'), false);
  assert.equal(robotsAllows(groups[2], '/api/mcp'), false);
  assert.deepEqual(checkRobots(GOOD_ROBOTS), []);
  assert.equal(checkRobots(BAD_ROBOTS).length, 4);
  assert.deepEqual(checkRobots('User-agent: GPTBot\nAllow: /\n').filter((e) => e.includes('default')), ['robots.txt: no default (*) group']);
});
test('title and security.txt helpers', () => {
  assert.equal(pageTitle('<html><title> A </title>'), 'A');
  assert.deepEqual(checkTitles({ '/a': 'X', '/b': 'Y' }), []);
  assert.equal(checkTitles({ '/a': 'X', '/b': 'X', '/c': '' }).length, 2);
  assert.equal(checkSecurityTxt(200, new Map([['content-type', 'application/json']]), 'Contact: x\nExpires: y').length, 1);
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
