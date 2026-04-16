import { describe, expect, it } from 'vitest';
import { hashScenarioSeed, pickScenarioVariant } from '@/lib/spatial-scenarios';

describe('spatial scenarios helpers', () => {
  it('produces deterministic scenario seed hashes', () => {
    const prompt = 'Optimize downtown delivery staging with policy-safe routing constraints.';
    const first = hashScenarioSeed(prompt);
    const second = hashScenarioSeed(prompt);

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(0);
  });

  it('returns fallback variant when none are provided', () => {
    expect(pickScenarioVariant(42, [])).toBe('Baseline scenario variant');
  });

  it('selects a deterministic variant from a non-empty list', () => {
    const variants = ['A', 'B', 'C'] as const;
    expect(pickScenarioVariant(4, variants)).toBe('B');
  });
});
