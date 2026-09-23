/**
 * Demo inventory drift guard (SPEC-0019).
 *
 * `src/data/demos.ts` is the single source of truth for which demos exist. Every public surface that
 * lists demos — gallery groups, crawler files, the AI-agent manifest — must agree with it. This test
 * exists because a registered demo silently went missing from the /demos gallery twice
 * (storm-research, then generative-ui).
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { demos } from '@/data/demos';
import { DEMO_GROUPS, SIGNATURE_DEMO_ID } from '@/data/demo-groups';
import { RETIRED_DEMO_REDIRECTS } from '@/data/legacy-routes';

const demoIds = demos.map((d) => d.id);
const BASE = 'https://www.prasadkavuri.com';

describe('demo inventory consistency', () => {
  it('every registered demo appears in exactly one gallery group, and groups reference no unknown ids', () => {
    const grouped = DEMO_GROUPS.flatMap((g) => g.ids);
    expect([...grouped].sort()).toEqual([...demoIds].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it('the signature demo is registered and sits in the core group', () => {
    expect(demoIds).toContain(SIGNATURE_DEMO_ID);
    expect(DEMO_GROUPS.find((g) => g.id === 'core')?.ids).toContain(SIGNATURE_DEMO_ID);
  });

  it('llms.txt and llms-full.txt list every registered demo and state the correct count', () => {
    const llms = readFileSync('public/llms.txt', 'utf8');
    const llmsFull = readFileSync('public/llms-full.txt', 'utf8');
    for (const demo of demos) {
      expect(llms).toContain(demo.href);
      expect(llmsFull).toContain(demo.href);
    }
    expect(llms).toContain(`${demos.length} live`);
  });

  it('the AI-agent manifest lists exactly the registered demos', () => {
    const manifest = JSON.parse(readFileSync('public/.well-known/ai-agent-manifest.json', 'utf8'));
    const urls = (manifest.demos as { url: string }[]).map((d) => d.url).sort();
    expect(urls).toEqual(demos.map((d) => `${BASE}${d.href}`).sort());
    expect(manifest.verified_demos).toBe(demos.length);
    expect(manifest.verified_impact_metrics.production_ai_systems).toBe(demos.length);
  });

  it('retired demos are gone from the registry, have no page, and permanently redirect', () => {
    for (const { source } of RETIRED_DEMO_REDIRECTS) {
      const slug = source.replace('/demos/', '');
      expect(demoIds).not.toContain(slug);
      expect(existsSync(`src/app/demos/${slug}/page.tsx`)).toBe(false);
    }
    const publicFiles = ['public/llms.txt', 'public/llms-full.txt', 'public/.well-known/ai-agent-manifest.json', 'public/entity.json'];
    for (const file of publicFiles) {
      const text = readFileSync(file, 'utf8');
      for (const { source } of RETIRED_DEMO_REDIRECTS) {
        expect(text, `${file} still links ${source}`).not.toContain(`${source}\n`);
        expect(text, `${file} still links ${source}`).not.toContain(`${BASE}${source}"`);
      }
    }
  });
});
