/**
 * SPEC-0027 stage 1: the Content Security Policy is built once (src/lib/csp.ts) and both delivery points
 * send exactly that string. BASELINE is the full policy as directive sets (source order is irrelevant to a
 * browser). Stage 1 pinned it to what shipped before; stage 3 narrowed the two CDN hosts to one package path.
 */
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import nextConfig from '../../../next.config';
import { proxy } from '../../proxy';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import {
  CONTENT_SECURITY_POLICY,
  CSP_DIRECTIVES,
  FULL_CSP_ROUTES,
  ORT_WASM_BASE,
  ORT_WEB_VERSION,
  STRICT_CONTENT_SECURITY_POLICY,
  buildCsp,
  cspForPath,
  cspTierFor,
} from '@/lib/csp';

const BASELINE: Record<string, string> = {
  'default-src': "'self'",
  'script-src': `'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' blob: ${ORT_WASM_BASE} https://va.vercel-scripts.com`,
  'worker-src': "'self' blob:",
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' blob: data: https:",
  'connect-src': `'self' blob: https://*.cdn.hf.co https://*.huggingface.co https://*.xethub.hf.co https://api.groq.com https://cdn-lfs-us-1.huggingface.co https://cdn-lfs.huggingface.co ${ORT_WASM_BASE} https://huggingface.co https://va.vercel-scripts.com https://xethub.hf.co`,
  'font-src': "'self' data:",
  'frame-ancestors': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'object-src': "'none'",
  'upgrade-insecure-requests': "",
};

const parse = (policy: string) =>
  Object.fromEntries(
    policy
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...sources] = d.split(/\s+/);
        return [name, sources.sort().join(' ')];
      }),
  );

describe('shared CSP (SPEC-0027 stage 1)', () => {
  it('matches the pinned policy (the only deliberate change since the refactor: *.cdn.hf.co, 2026-10-17)', () => {
    expect(parse(CONTENT_SECURITY_POLICY)).toEqual(BASELINE);
  });

  it('has no duplicate directives and no empty source lists except upgrade-insecure-requests', () => {
    const names = CSP_DIRECTIVES.map(([name]) => name);
    expect(new Set(names).size).toBe(names.length);
    for (const [name, sources] of CSP_DIRECTIVES) {
      if (name !== 'upgrade-insecure-requests') expect(sources.length, name).toBeGreaterThan(0);
    }
  });

  it('never allows a bare https: or * in script-src or connect-src', () => {
    const parsed = parse(CONTENT_SECURITY_POLICY);
    for (const name of ['script-src', 'connect-src']) {
      const sources = parsed[name].split(' ');
      expect(sources).not.toContain('https:');
      expect(sources).not.toContain('*');
    }
  });

  it('buildCsp joins directives with "; " and no trailing semicolon', () => {
    expect(buildCsp([['a', ['x', 'y']], ['b', []]])).toBe('a x y; b');
  });

  it('next.config.ts no longer sets a CSP, so a route never gets two different policies', async () => {
    const rules = await nextConfig.headers!();
    for (const rule of rules) {
      expect(rule.headers.map((h) => h.key), rule.source).not.toContain('Content-Security-Policy');
    }
  });

  it('proxy.ts sends the full policy on the three WASM demos and the strict policy elsewhere', async () => {
    const get = async (path: string) =>
      (await proxy(new NextRequest(`https://www.prasadkavuri.com${path}`, { headers: { 'x-forwarded-for': '203.0.113.77' } }))) as Response;
    for (const route of FULL_CSP_ROUTES) {
      const res = await get(route);
      expect(res.headers.get('Content-Security-Policy'), route).toBe(CONTENT_SECURITY_POLICY);
      expect(res.headers.get('Server-Timing'), route).toContain('csp;desc="full"');
    }
    for (const route of ['/', '/demos', '/demos/llm-router', '/demos/rag-pipeline-extra', '/governance']) {
      const res = await get(route);
      expect(res.headers.get('Content-Security-Policy'), route).toBe(STRICT_CONTENT_SECURITY_POLICY);
      expect(res.headers.get('Server-Timing'), route).toContain('csp;desc="strict"');
    }
    const api = await get('/api/context');
    expect(api.headers.get('Content-Security-Policy')).toBe(STRICT_CONTENT_SECURITY_POLICY);
    expect(api.headers.get('Server-Timing') ?? '').not.toContain('csp;');
  });

  it('cspTierFor matches routes exactly, with sub-paths and a trailing slash', () => {
    expect(cspTierFor('/demos/quantization')).toBe('full');
    expect(cspTierFor('/demos/quantization/')).toBe('full');
    expect(cspTierFor('/demos/quantization/x')).toBe('full');
    expect(cspTierFor('/demos/quantization-x')).toBe('strict');
    expect(cspTierFor('/')).toBe('strict');
    expect(cspForPath('/about')).toBe(STRICT_CONTENT_SECURITY_POLICY);
  });
});

describe('narrowed CDN allowance (SPEC-0027 stage 3)', () => {
  it('allows the CDN only at the pinned onnxruntime-web path, never the whole host', () => {
    const parsed = parse(CONTENT_SECURITY_POLICY);
    for (const name of ['script-src', 'connect-src']) {
      const sources = parsed[name].split(' ');
      expect(sources, name).toContain(ORT_WASM_BASE);
      expect(sources, name).not.toContain('https://cdn.jsdelivr.net');
      expect(sources, name).not.toContain('https://unpkg.com');
    }
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/unpkg/);
  });

  it('ORT_WEB_VERSION equals the installed onnxruntime-web (update csp.ts when you upgrade Transformers.js)', () => {
    const installed = JSON.parse(readFileSync('node_modules/onnxruntime-web/package.json', 'utf8')).version;
    expect(ORT_WEB_VERSION).toBe(installed);
  });

  it('Transformers.js still loads its runtime from the address the CSP allows', () => {
    const lib = readFileSync('node_modules/@huggingface/transformers/dist/transformers.js', 'utf8');
    expect(lib).toContain('https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNX_ENV.versions.web}/dist/');
    const pinned = JSON.parse(readFileSync('node_modules/@huggingface/transformers/package.json', 'utf8')).dependencies['onnxruntime-web'];
    expect(pinned).toBe(ORT_WEB_VERSION);
  });

  it('the Quantization demo probes only the pinned address', () => {
    const page = readFileSync('src/app/demos/quantization/page.tsx', 'utf8');
    expect(page).toContain('[ORT_WASM_BASE]');
    expect(page).not.toMatch(/unpkg|cdn\.jsdelivr\.net/);
  });
});

describe('strict CSP (SPEC-0027 stage 2)', () => {
  const strict = parse(STRICT_CONTENT_SECURITY_POLICY);
  const full = parse(CONTENT_SECURITY_POLICY);

  it('drops eval, WASM, blob script, CDN script origins and model hosts', () => {
    const script = strict['script-src'].split(' ');
    for (const banned of ["'unsafe-eval'", "'wasm-unsafe-eval'", 'blob:', 'https://cdn.jsdelivr.net', 'https://unpkg.com']) {
      expect(script, banned).not.toContain(banned);
    }
    expect(strict['worker-src']).toBe("'self'");
    expect(strict['connect-src']).not.toMatch(/huggingface|hf\.co|jsdelivr|unpkg|groq|blob:/);
  });

  it('never grants more than the full policy, directive by directive', () => {
    for (const [name, value] of Object.entries(strict)) {
      const allowed = new Set(full[name].split(' '));
      for (const source of value.split(' ').filter(Boolean)) expect(allowed.has(source), `${name} ${source}`).toBe(true);
    }
  });

  it('keeps the non-script hardening directives identical', () => {
    for (const name of ['frame-ancestors', 'base-uri', 'form-action', 'object-src', 'upgrade-insecure-requests', 'default-src']) {
      expect(strict[name]).toBe(full[name]);
    }
  });

  it('every page that loads the browser model runtime is on the full-policy list', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : [path];
      });
    const users = walk('src/app')
      .filter((f) => /page\.tsx$/.test(f))
      .filter((f) => /transformers-loader|edge-inference|@huggingface\/transformers|onnxruntime/.test(readFileSync(f, 'utf8')))
      .map((f) => '/' + f.replace(/^src\/app\//, '').replace(/\/page\.tsx$/, ''));
    expect(users.sort()).toEqual([...FULL_CSP_ROUTES].sort());
  });

  it('every full-policy page renders the reload guard', () => {
    for (const route of FULL_CSP_ROUTES) {
      expect(readFileSync(`src/app${route}/page.tsx`, 'utf8'), route).toContain('<RequireFullCsp />');
    }
  });
});

describe('model download hosts (regression, 2026-10-17)', () => {
  // Hugging Face redirects model files to these hosts. A host missing here blocks every in-browser model
  // download, and the three WASM demos silently fall back to simulated mode.
  const MODEL_HOSTS = ['huggingface.co', 'cdn-lfs.huggingface.co', 'xethub.hf.co', 'cas-bridge.xethub.hf.co', 'us.aws.cdn.hf.co'];
  const allows = (sources: string[], host: string) =>
    sources.some((src) => {
      const h = src.replace(/^https:\/\//, '');
      return h === host || (h.startsWith('*.') && host.endsWith(h.slice(1)));
    });
  it.each(MODEL_HOSTS)('the full policy lets the browser connect to %s', (host) => {
    expect(allows(parse(CONTENT_SECURITY_POLICY)['connect-src'].split(' '), host)).toBe(true);
  });
});
