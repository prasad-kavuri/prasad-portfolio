import { describe, expect, it } from 'vitest';
import { detectStructuredPII, findStructuredPIISpans } from '@/lib/guardrails';

describe('findStructuredPIISpans', () => {
  it('finds the same kinds of PII that detectStructuredPII reports', () => {
    const text = 'a@b.co 312-555-0147 123-45-6789 4111 1111 1111 1111 ACC-77-XK';
    const types = new Set(findStructuredPIISpans(text).map((s) => s.type));
    expect(types).toEqual(new Set(detectStructuredPII(text)));
  });

  it('prefers the more specific type when patterns overlap', () => {
    const spans = findStructuredPIISpans('Card 4111111111111111 on file');
    expect(spans).toHaveLength(1);
    expect(spans[0].type).toBe('CREDIT_CARD');
  });

  it('returns ordered, non-overlapping spans that point at the matched text', () => {
    const text = 'Mail a@b.co then call 312-555-0147.';
    const spans = findStructuredPIISpans(text);
    expect(spans.map((s) => text.slice(s.start, s.end))).toEqual(['a@b.co', '312-555-0147']);
  });

  it('returns nothing for text without structured PII', () => {
    expect(findStructuredPIISpans('Plan the Q3 launch in 12 weeks.')).toEqual([]);
  });
});
