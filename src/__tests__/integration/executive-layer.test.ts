import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import sitemap from '@/app/sitemap';
import { PERSPECTIVES } from '@/data/perspectives';

describe('executive layer (SPEC-0022)', () => {
  it('every perspective in the registry has a page, and the index is in the sitemap', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain('https://www.prasadkavuri.com/perspectives');
    for (const article of PERSPECTIVES) {
      expect(existsSync(`src/app/perspectives/${article.slug}/page.tsx`)).toBe(true);
      expect(urls).toContain(`https://www.prasadkavuri.com/perspectives/${article.slug}`);
    }
  });

  it('operating model maps controls to NIST AI RMF and ISO/IEC 42001 without claiming certification', () => {
    const page = readFileSync('src/app/enterprise-ai-operating-model/page.tsx', 'utf8');
    for (const fn of ['Govern', 'Map', 'Measure', 'Manage']) expect(page).toContain(`fn: '${fn}'`);
    expect(page).toContain('ISO/IEC 42001');
    expect(page).toMatch(/alignment map, not a certification/);
    expect(page).not.toMatch(/(?<!not a )certified|compliant with/i);
  });

  it('primary nav is leadership-first', () => {
    const nav = readFileSync('src/components/layout/Navbar.tsx', 'utf8');
    const order = ['"Leadership"', '"Operating Model"', 'Flagship: Governed Agent Platform', '"Perspectives"', '"About & Contact"'].map((l) => nav.indexOf(l));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(nav).not.toContain('"For Recruiters"');
  });

  it('no page claims a title Prasad does not hold', () => {
    for (const f of ['src/app/demos/multi-agent/metadata.ts', 'src/app/demos/rag-pipeline/metadata.ts', 'src/app/demos/enterprise-control-plane/metadata.ts']) {
      expect(readFileSync(f, 'utf8')).not.toContain('by VP of AI Engineering');
    }
  });
});
