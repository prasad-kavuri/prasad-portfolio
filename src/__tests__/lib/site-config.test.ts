import { describe, it, expect } from 'vitest';
import { demos } from '@/data/demos';
import { PORTFOLIO_FACTS, SITE_URL, formatProductionDemoLabel } from '@/data/site-config';

describe('site-config', () => {
  it('uses canonical www site URL', () => {
    expect(SITE_URL).toBe('https://www.prasadkavuri.com');
  });

  it('keeps production demo count synchronized with demos registry', () => {
    expect(PORTFOLIO_FACTS.productionDemoCount).toBe(demos.length);
  });

  it('formats production demo label from canonical demo count', () => {
    expect(formatProductionDemoLabel()).toBe(`${demos.length} production demos`);
  });
});
