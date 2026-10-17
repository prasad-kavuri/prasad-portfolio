import { describe, expect, it } from 'vitest';
import { getRoutingRecommendation } from '@/lib/llm-routing';
import { CAPABLE_MODEL, CODE_MODEL, FAST_MODEL } from '@/lib/groq-models';

describe('getRoutingRecommendation', () => {
  it('routes simple factual prompts to the low-cost fast tier', () => {
    const rec = getRoutingRecommendation('What is the capital of France?');
    expect(rec.model).toBe(FAST_MODEL.id);
    expect(rec.rationale).toMatch(/low-complexity/i);
  });

  it('routes code prompts to qwen coding tier', () => {
    const rec = getRoutingRecommendation('Write a Python function for quicksort');
    expect(rec.model).toBe(CODE_MODEL.id);
    expect(rec.rationale).toMatch(/code-oriented/i);
  });

  it('routes analysis prompts to higher capability reasoning tier', () => {
    const rec = getRoutingRecommendation('Analyze architecture tradeoffs for multi-agent systems');
    expect(rec.model).toBe(CAPABLE_MODEL.id);
    expect(rec.executiveTradeoff).toMatch(/reasoning quality/i);
  });

  it('routes prompts with no complexity signal to the fast, low-cost tier', () => {
    const rec = getRoutingRecommendation(
      'Draft a thoughtful portfolio assistant response for a recruiter exploring platform leadership examples.'
    );
    expect(rec.model).toBe(FAST_MODEL.id);
    expect(rec.rationale).toMatch(/no complexity signal/i);
  });
});
