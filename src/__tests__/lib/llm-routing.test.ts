import { describe, expect, it } from 'vitest';
import { getRoutingRecommendation } from '@/lib/llm-routing';

describe('getRoutingRecommendation', () => {
  it('routes simple factual prompts to the low-cost fast tier', () => {
    const rec = getRoutingRecommendation('What is the capital of France?');
    expect(rec.model).toBe('llama-3.1-8b-instant');
    expect(rec.rationale).toMatch(/low-complexity/i);
  });

  it('routes code prompts to qwen coding tier', () => {
    const rec = getRoutingRecommendation('Write a Python function for quicksort');
    expect(rec.model).toBe('qwen/qwen3-32b');
    expect(rec.rationale).toMatch(/code-oriented/i);
  });

  it('routes analysis prompts to higher capability reasoning tier', () => {
    const rec = getRoutingRecommendation('Analyze architecture tradeoffs for multi-agent systems');
    expect(rec.model).toBe('llama-3.3-70b-versatile');
    expect(rec.executiveTradeoff).toMatch(/reasoning quality/i);
  });
});
