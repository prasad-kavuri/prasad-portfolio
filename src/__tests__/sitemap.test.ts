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
});
