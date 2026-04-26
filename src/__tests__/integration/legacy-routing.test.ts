import { describe, it, expect } from 'vitest';
import nextConfig from '../../../next.config';
import { proxy } from '@/proxy';
import { LEGACY_HTML_REDIRECTS, resolveLegacyHtmlPath } from '@/data/legacy-routes';

function makeProxyRequest(pathname: string) {
  return {
    nextUrl: { pathname },
    url: `https://www.prasadkavuri.com${pathname}`,
  } as any;
}

describe('Legacy routing policy', () => {
  it('next.config redirects include every explicit legacy .html mapping', async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toBeDefined();

    for (const mapping of LEGACY_HTML_REDIRECTS) {
      expect(redirects).toContainEqual({
        source: mapping.source,
        destination: mapping.destination,
        permanent: true,
      });
    }
  });

  it('next.config redirects unknown root .html slugs to demos index', async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: '/:path*.html',
      destination: '/demos',
      permanent: true,
    });
  });

  it('resolveLegacyHtmlPath maps explicit legacy URLs to canonical demo routes', () => {
    expect(resolveLegacyHtmlPath('/multi-agent-demo.html')).toBe('/demos/multi-agent');
    expect(resolveLegacyHtmlPath('/demos/portfolio-assistant.html')).toBe('/demos/portfolio-assistant');
  });

  it('resolveLegacyHtmlPath maps demo slug .html URLs to canonical /demos routes', () => {
    expect(resolveLegacyHtmlPath('/evaluation-showcase.html')).toBe('/demos/evaluation-showcase');
    expect(resolveLegacyHtmlPath('/demos/world-generation.html')).toBe('/demos/world-generation');
  });

  it('resolveLegacyHtmlPath maps unknown .html routes to demos index', () => {
    expect(resolveLegacyHtmlPath('/legacy-unknown-demo.html')).toBe('/demos');
  });

  it('proxy issues permanent redirects for known legacy .html routes', () => {
    const response = proxy(makeProxyRequest('/portfolio-assistant.html'));
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://www.prasadkavuri.com/demos/portfolio-assistant');
  });

  it('proxy routes unknown .html requests to canonical demos index', () => {
    const response = proxy(makeProxyRequest('/something-legacy.html'));
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://www.prasadkavuri.com/demos');
  });

  it('/resume-generator.html redirects 301 to /demos/resume-generator', async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: '/resume-generator.html',
      destination: '/demos/resume-generator',
      permanent: true,
    });
  });

  it('/multi-agent-demo.html redirects 301 to /demos/multi-agent', async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: '/multi-agent-demo.html',
      destination: '/demos/multi-agent',
      permanent: true,
    });
  });

  it('/multimodal-assistant.html redirects 301 to /demos/multimodal', async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: '/multimodal-assistant.html',
      destination: '/demos/multimodal',
      permanent: true,
    });
  });
});
