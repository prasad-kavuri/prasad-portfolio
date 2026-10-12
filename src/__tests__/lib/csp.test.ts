/**
 * SPEC-0027 stage 1: the Content Security Policy is built once (src/lib/csp.ts) and both delivery points
 * send exactly that string. BASELINE is the policy that shipped before the refactor, as directive sets
 * (source order is irrelevant to a browser), so this stage cannot silently change behaviour.
 */
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import nextConfig from '../../../next.config';
import { proxy } from '../../proxy';
import { CONTENT_SECURITY_POLICY, CSP_DIRECTIVES, buildCsp } from '@/lib/csp';

const BASELINE: Record<string, string> = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net https://unpkg.com https://va.vercel-scripts.com",
  'worker-src': "'self' blob:",
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' blob: data: https:",
  'connect-src': "'self' blob: https://*.huggingface.co https://*.xethub.hf.co https://api.groq.com https://cdn-lfs-us-1.huggingface.co https://cdn-lfs.huggingface.co https://cdn.jsdelivr.net https://huggingface.co https://unpkg.com https://va.vercel-scripts.com https://xethub.hf.co",
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
  it('matches the policy that shipped before the refactor', () => {
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

  it('next.config.ts sends the shared policy on every route', async () => {
    const rules = await nextConfig.headers!();
    const catchAll = rules.find((rule) => rule.source === '/(.*)');
    const value = catchAll?.headers.find((h) => h.key === 'Content-Security-Policy')?.value;
    expect(value).toBe(CONTENT_SECURITY_POLICY);
  });

  it('proxy.ts sends the same string on pages and on API routes', async () => {
    const page = await proxy(new NextRequest('https://www.prasadkavuri.com/demos'));
    const api = await proxy(new NextRequest('https://www.prasadkavuri.com/api/context', { headers: { 'x-forwarded-for': '203.0.113.77' } }));
    expect(page.headers.get('Content-Security-Policy')).toBe(CONTENT_SECURITY_POLICY);
    expect(api.headers.get('Content-Security-Policy')).toBe(CONTENT_SECURITY_POLICY);
  });
});
