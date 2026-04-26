import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';

describe('sitemap()', () => {
  it('returns an array', () => {
    const result = sitemap();
    expect(Array.isArray(result)).toBe(true);
  });

  it('array length > 15', () => {
    const result = sitemap();
    expect(result.length).toBeGreaterThan(15);
  });

  it('homepage entry has priority 1.0', () => {
    const result = sitemap();
    const home = result.find((e) => e.url === 'https://www.prasadkavuri.com');
    expect(home).toBeDefined();
    expect(home?.priority).toBe(1.0);
  });

  it('for-recruiters entry has priority 0.95', () => {
    const result = sitemap();
    const entry = result.find((e) => e.url.endsWith('/for-recruiters'));
    expect(entry).toBeDefined();
    expect(entry?.priority).toBe(0.95);
  });

  it('includes canonical entity profile and machine-readable entity resources', () => {
    const result = sitemap();
    const urls = result.map((entry) => entry.url);
    expect(urls).toContain('https://www.prasadkavuri.com/about');
    expect(urls).toContain('https://www.prasadkavuri.com/entity.json');
    expect(urls).toContain('https://www.prasadkavuri.com/resume.md');
    expect(urls).toContain('https://www.prasadkavuri.com/llms.txt');
    expect(urls).toContain('https://www.prasadkavuri.com/llms-full.txt');
    expect(urls).toContain('https://www.prasadkavuri.com/.well-known/ai-agent-manifest.json');
  });

  it('evaluation-showcase entry has priority 0.9', () => {
    const result = sitemap();
    const entry = result.find((e) => e.url.includes('evaluation-showcase'));
    expect(entry).toBeDefined();
    expect(entry?.priority).toBe(0.9);
  });

  it('no entry has an undefined priority', () => {
    const result = sitemap();
    const bad = result.filter((e) => e.priority === undefined);
    expect(bad).toHaveLength(0);
  });

  it('no .html URLs appear in sitemap output', () => {
    const result = sitemap();
    const htmlEntries = result.filter((e) => e.url.endsWith('.html'));
    expect(htmlEntries).toHaveLength(0);
  });

  it('/about entry has priority 0.95', () => {
    const result = sitemap();
    const entry = result.find((e) => e.url.endsWith('/about'));
    expect(entry).toBeDefined();
    expect(entry?.priority).toBeGreaterThanOrEqual(0.9);
    expect(entry?.priority).toBe(0.95);
  });

  it('/entity.json is present in sitemap', () => {
    const result = sitemap();
    const entry = result.find((e) => e.url.includes('/entity.json'));
    expect(entry).toBeDefined();
  });

  it('/certifications has priority 0.75', () => {
    const result = sitemap();
    const entry = result.find((e) => e.url.endsWith('/certifications'));
    expect(entry).toBeDefined();
    expect(entry?.priority).toBe(0.75);
  });
});
