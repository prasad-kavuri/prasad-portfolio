#!/usr/bin/env node
// Post-deploy verification (SPEC-0028). Pure checks are exported for tests; the CLI fetches the live site.
import { pathToFileURL } from 'node:url';

// Must equal ORT_WASM_BASE in src/lib/csp.ts (guarded by a test).
export const ORT_WASM_BASE = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/';
export const DEFAULT_BASE = 'https://www.prasadkavuri.com';
export const FULL_ROUTES = ['/demos/rag-pipeline', '/demos/quantization', '/demos/edge-agent-collaboration'];
export const STRICT_ROUTES = ['/', '/about', '/for-recruiters', '/governance'];
export const LINK_TARGETS = ['/for-recruiters', '/about', '/governance', '/status'];

/** Sources of one CSP directive, e.g. directive(csp, 'script-src'). Empty if the directive is absent. */
export function directive(csp, name) {
  const d = csp.split(';').map((x) => x.trim().split(/\s+/)).find((x) => x[0] === name);
  return d ? d.slice(1) : [];
}

/** Header checks for one page response. `headers` is a Headers-like object with get(). */
export function checkPage(path, status, headers, tier) {
  const errs = [];
  const fail = (m) => errs.push(`${path}: ${m}`);
  if (status !== 200) fail(`status ${status}, expected 200`);
  const csp = headers.get('content-security-policy') ?? '';
  const timing = headers.get('server-timing') ?? '';
  if (!csp) fail('missing Content-Security-Policy');
  if (!timing.includes(`csp;desc="${tier}"`)) fail(`Server-Timing is "${timing}", expected csp;desc="${tier}"`);
  // Only the directives that run or load code are judged: img-src legitimately keeps blob: in the strict policy.
  const script = directive(csp, 'script-src');
  const worker = directive(csp, 'worker-src');
  const connect = directive(csp, 'connect-src');
  if (tier === 'strict') {
    for (const bad of ["'unsafe-eval'", "'wasm-unsafe-eval'", 'blob:', 'https://cdn.jsdelivr.net', 'https://unpkg.com']) {
      if (script.includes(bad)) fail(`strict script-src contains ${bad}`);
    }
    if (worker.includes('blob:')) fail('strict worker-src contains blob:');
    if (connect.some((x) => /huggingface|hf\.co|jsdelivr|unpkg/.test(x))) fail('strict connect-src allows a model or CDN host');
  } else {
    if (!script.includes("'wasm-unsafe-eval'")) fail("full script-src lacks 'wasm-unsafe-eval'");
    // SPEC-0027 stage 3: the CDN is allowed only at the pinned onnxruntime-web path.
    if (!script.includes(ORT_WASM_BASE)) fail('full script-src lacks the pinned onnxruntime-web path');
    for (const bad of ['https://cdn.jsdelivr.net', 'https://unpkg.com']) {
      if (script.includes(bad) || connect.includes(bad)) fail(`full policy still allows the whole origin ${bad}`);
    }
  }
  if (!(headers.get('strict-transport-security') ?? '').includes('max-age=')) fail('missing HSTS');
  if (headers.get('x-content-type-options') !== 'nosniff') fail('X-Content-Type-Options is not nosniff');
  if (headers.get('x-frame-options') !== 'DENY') fail('X-Frame-Options is not DENY');
  if (headers.get('cross-origin-opener-policy') !== 'same-origin') fail('COOP is not same-origin');
  return errs;
}

/** /api/* gets a CSP but no csp Server-Timing entry. */
export function checkApi(path, headers) {
  const errs = [];
  if (!headers.get('content-security-policy')) errs.push(`${path}: missing Content-Security-Policy`);
  if ((headers.get('server-timing') ?? '').includes('csp;')) errs.push(`${path}: unexpected csp Server-Timing`);
  return errs;
}

/** The header (not the footer) must link to the target. */
export function headerLinks(html, href) {
  const m = html.match(/<header[\s\S]*?<\/header>/i);
  return !!m && new RegExp(`href="${href}"`).test(m[0]);
}

async function get(fetchFn, url) {
  const res = await fetchFn(url, { redirect: 'manual', headers: { 'user-agent': 'prasad-portfolio-verify-deploy' } });
  return res;
}

export async function verify(base, fetchFn = fetch) {
  const errs = [];
  for (const [routes, tier] of [[STRICT_ROUTES, 'strict'], [FULL_ROUTES, 'full']]) {
    for (const path of routes) {
      const res = await get(fetchFn, base + path);
      errs.push(...checkPage(path, res.status, res.headers, tier));
      if (path === '/' && res.status === 200 && !headerLinks(await res.text(), '/for-recruiters')) {
        errs.push('/: header has no link to /for-recruiters');
      }
    }
  }
  const api = await get(fetchFn, `${base}/api/context`);
  errs.push(...checkApi('/api/context', api.headers));
  for (const path of LINK_TARGETS) {
    const res = await get(fetchFn, base + path);
    if (res.status !== 200) errs.push(`link ${path}: status ${res.status}`);
  }
  return errs;
}

export async function main(argv = process.argv.slice(2), fetchFn = fetch, wait = (ms) => new Promise((r) => setTimeout(r, ms))) {
  const i = argv.indexOf('--base');
  const base = (i >= 0 ? argv[i + 1] : DEFAULT_BASE).replace(/\/$/, '');
  const attempts = 3;
  let errs = [];
  for (let n = 1; n <= attempts; n++) {
    try { errs = await verify(base, fetchFn); } catch (e) { errs = [`request failed: ${e.message}`]; }
    if (!errs.length) { console.log(`verify-deploy: ${base} OK`); return 0; }
    if (n < attempts) { console.log(`attempt ${n} failed (${errs.length}), retrying in 20s`); await wait(20_000); }
  }
  console.error(`verify-deploy: ${base} FAILED\n- ${errs.join('\n- ')}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main());
}
