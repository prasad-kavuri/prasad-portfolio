#!/usr/bin/env node
// Post-deploy verification (SPEC-0028). Pure checks are exported for tests; the CLI fetches the live site.
import { pathToFileURL } from 'node:url';

// Must equal ORT_WASM_BASE in src/lib/csp.ts (guarded by a test).
export const ORT_WASM_BASE = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/';
export const DEFAULT_BASE = 'https://www.prasadkavuri.com';
export const REQUEST_TIMEOUT_MS = 10_000;
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
  for (const [name, expected] of [['default-src', "'self'"], ['base-uri', "'self'"], ['form-action', "'self'"], ['object-src', "'none'"], ['frame-ancestors', "'none'"]]) {
    const values = directive(csp, name);
    if (values.length !== 1 || values[0] !== expected) fail(`${name} must be ${expected}`);
  }
  for (const name of ['default-src', 'base-uri', 'form-action', 'object-src', 'frame-ancestors', 'script-src', 'worker-src', 'connect-src']) {
    if (csp.split(';').filter((part) => part.trim().split(/\s+/)[0] === name).length !== 1) fail(`expected exactly one ${name}`);
  }
  for (const [name, values] of [['script-src', script], ['worker-src', worker], ['connect-src', connect]]) {
    if (!values.includes("'self'")) fail(`${name} lacks 'self'`);
    if (values.some((value) => value === '*' || /^(?:https?|data):$/.test(value) || /^https?:\/\/\*\/?$/.test(value) || (name !== 'connect-src' && value.includes('://*')))) fail(`${name} permits an unrestricted source`);
  }
  const scriptAllowed = ["'self'", "'unsafe-inline'", 'https://va.vercel-scripts.com', ...(tier === 'full' ? ["'unsafe-eval'", "'wasm-unsafe-eval'", 'blob:', ORT_WASM_BASE] : [])];
  const workerAllowed = ["'self'", ...(tier === 'full' ? ['blob:'] : [])];
  if (script.some((source) => !scriptAllowed.includes(source))) fail('script-src contains an unapproved source');
  if (worker.some((source) => !workerAllowed.includes(source))) fail('worker-src contains an unapproved source');
  if (tier === 'strict' && connect.some((source) => !["'self'", 'https://va.vercel-scripts.com'].includes(source))) fail('strict connect-src contains an unapproved source');
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
    // Model downloads redirect to the Hugging Face CDN; without this entry every demo silently falls back.
    if (!connect.includes('https://*.cdn.hf.co')) fail('full connect-src lacks https://*.cdn.hf.co (model downloads blocked)');
    for (const bad of ['https://cdn.jsdelivr.net', 'https://unpkg.com']) {
      if (script.includes(bad) || connect.includes(bad)) fail(`full policy still allows the whole origin ${bad}`);
    }
  }
  const hsts = headers.get('strict-transport-security') ?? '';
  const ages = [...hsts.matchAll(/(?:^|;)\s*max-age\s*=\s*(\d+)\s*(?=;|$)/gi)];
  if (ages.length !== 1 || Number(ages[0][1]) < 31536000 || !/(?:^|;)\s*includeSubDomains\s*(?:;|$)/i.test(hsts)) fail('HSTS must include max-age >= 31536000 and includeSubDomains');
  if (headers.get('x-content-type-options') !== 'nosniff') fail('X-Content-Type-Options is not nosniff');
  if (headers.get('x-frame-options') !== 'DENY') fail('X-Frame-Options is not DENY');
  if (headers.get('cross-origin-opener-policy') !== 'same-origin') fail('COOP is not same-origin');
  if (headers.get('cross-origin-embedder-policy') !== 'credentialless') fail('COEP is not credentialless');
  const permissions = headers.get('permissions-policy') ?? '';
  for (const feature of ['camera', 'microphone', 'geolocation', 'payment', 'usb', 'serial']) {
    if (!new RegExp(`(?:^|,)\\s*${feature}\\s*=\\s*\\(\\s*\\)\\s*(?=,|$)`).test(permissions)) fail(`Permissions-Policy must disable ${feature}`);
  }
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

/** Paths every robots.txt group must leave open so agents can fetch the resume and reach MCP and A2A. */
export const AGENT_PATHS = ['/api/resume-download', '/api/mcp', '/api/a2a', '/api/context'];
/** Pages that once shared the homepage title; each must keep its own. */
export const TITLE_ROUTES = ['/', '/recruiter-dashboard', '/agent-marketplace', '/agent-readiness', '/demos/edge-agent-collaboration', '/demos/agent-auth', '/demos/storm-research', '/demos/generative-ui'];

/** Split robots.txt into groups of { agents, allow, disallow }. */
export function parseRobots(text) {
  const groups = [];
  let cur = null;
  let lastWasAgent = false;
  for (const raw of text.split('\n')) {
    const line = raw.split('#')[0].trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], allow: [], disallow: [] }; groups.push(cur); }
      cur.agents.push(m[2]);
      lastWasAgent = true;
    } else if (cur && (key === 'allow' || key === 'disallow')) {
      cur[key].push(m[2]);
      lastWasAgent = false;
    }
  }
  return groups;
}

/** Longest matching rule wins; Allow wins a tie (RFC 9309). Wildcards are not needed for these paths. */
export function robotsAllows(group, path) {
  let best = { len: -1, allow: true };
  for (const [rules, allow] of [[group.allow, true], [group.disallow, false]]) {
    for (const r of rules) {
      if (!r) continue;
      const prefix = r.replace(/\*$/, '');
      if (r.includes('*') && !r.endsWith('*')) continue;
      if (path.startsWith(prefix) && (prefix.length > best.len || (prefix.length === best.len && allow))) best = { len: prefix.length, allow };
    }
  }
  return best.allow;
}

export function checkRobots(text) {
  const errs = [];
  const groups = parseRobots(text);
  if (!groups.some((g) => g.agents.includes('*'))) errs.push('robots.txt: no default (*) group');
  for (const g of groups) {
    for (const p of AGENT_PATHS) {
      if (!robotsAllows(g, p)) errs.push(`robots.txt: ${g.agents.join(',')} is blocked from ${p}`);
    }
  }
  return errs;
}

export function pageTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : '';
}

export function checkTitles(titles) {
  const errs = [];
  const seen = new Map();
  for (const [path, title] of Object.entries(titles)) {
    if (!title) { errs.push(`${path}: missing <title>`); continue; }
    if (seen.has(title)) errs.push(`${path}: title duplicates ${seen.get(title)}`);
    else seen.set(title, path);
  }
  return errs;
}

export function checkSecurityTxt(status, headers, body, now = Date.now()) {
  const errs = [];
  if (status !== 200) errs.push(`security.txt: status ${status}`);
  if (!/^text\/plain/i.test(headers.get('content-type') ?? '')) errs.push(`security.txt: content-type is "${headers.get('content-type')}", expected text/plain`);
  if (!/^Contact:[ \t]*\S/im.test(body)) errs.push('security.txt: missing Contact');
  const expires = [...body.matchAll(/^Expires:[ \t]*(.*)$/gim)];
  if (expires.length !== 1) errs.push('security.txt: expected exactly one Expires field');
  else {
    const value = expires[0][1].trim();
    const format = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/i.exec(value);
    const timestamp = Date.parse(value);
    const calendarDay = format ? Date.parse(`${format[1]}T00:00:00Z`) : NaN;
    if (!format || !Number.isFinite(timestamp) || !Number.isFinite(calendarDay) || new Date(calendarDay).toISOString().slice(0, 10) !== format[1]) {
      errs.push('security.txt: Expires must be a valid RFC3339 timestamp');
    } else if (timestamp <= now) errs.push('security.txt: Expires is not in the future');
  }
  return errs;
}

async function get(fetchFn, url, readBody = false) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`request timed out after ${REQUEST_TIMEOUT_MS}ms: ${new URL(url).pathname}`);
      reject(error);
      controller.abort(error);
    }, REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([deadline, (async () => {
      const res = await fetchFn(url, { redirect: 'manual', signal: controller.signal, headers: { 'user-agent': 'prasad-portfolio-verify-deploy' } });
      if (!readBody) { await res.body?.cancel(); return res; }
      const body = await res.text();
      return { status: res.status, headers: res.headers, text: async () => body };
    })()]);
  } finally {
    clearTimeout(timer);
  }
}

export async function verify(base, fetchFn = fetch) {
  const errs = [];
  for (const [routes, tier] of [[STRICT_ROUTES, 'strict'], [FULL_ROUTES, 'full']]) {
    for (const path of routes) {
      const res = await get(fetchFn, base + path, path === '/');
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
  const robotsRes = await get(fetchFn, `${base}/robots.txt`, true);
  errs.push(...checkRobots(await robotsRes.text()));
  const titles = {};
  for (const path of TITLE_ROUTES) {
    const res = await get(fetchFn, base + path, true);
    titles[path] = pageTitle(await res.text());
  }
  errs.push(...checkTitles(titles));
  const sec = await get(fetchFn, `${base}/.well-known/security.txt`, true);
  errs.push(...checkSecurityTxt(sec.status, sec.headers, await sec.text()));
  const resume = await get(fetchFn, `${base}/resume`);
  if (![301, 302, 307, 308].includes(resume.status) || !(resume.headers.get('location') ?? '').includes('/api/resume-download')) errs.push(`/resume: status ${resume.status}, expected a redirect to /api/resume-download`);
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
