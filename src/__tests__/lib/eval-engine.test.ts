import { describe, it, expect } from 'vitest';
import { scoreResponse, runEvals, type EvalCase } from '@/lib/eval-engine';

// ---------------------------------------------------------------------------
// scoreResponse — branch coverage for uncovered paths
// ---------------------------------------------------------------------------
describe('scoreResponse — details string construction', () => {
  it('details includes missed=[...] when terms are not covered', () => {
    const ec: EvalCase = {
      id: 'detail-001',
      query: 'q',
      requiredCoverage: ['krutrim', 'ola', 'here'],
    };
    const result = scoreResponse('Only mentions krutrim.', ec);
    expect(result.details).toContain('missed=[');
    expect(result.details).toContain('ola');
    expect(result.details).toContain('here');
  });

  it('details includes forbidden=[...] when a forbidden topic matches', () => {
    const ec: EvalCase = {
      id: 'detail-002',
      query: 'q',
      requiredCoverage: ['krutrim'],
      forbiddenTopics: ['openai'],
    };
    const result = scoreResponse('Krutrim and OpenAI are both great.', ec);
    expect(result.details).toContain('forbidden=[');
    expect(result.details).toContain('openai');
  });

  it('details contains only score= when response is perfect with no forbidden hits', () => {
    const ec: EvalCase = {
      id: 'detail-003',
      query: 'q',
      requiredCoverage: ['krutrim'],
      forbiddenTopics: ['openai'],
    };
    const result = scoreResponse('Krutrim is great.', ec);
    expect(result.details).toBe('score=1.00');
  });
});

describe('scoreResponse — score floor and penalty arithmetic', () => {
  it('floors score at 0 when forbidden penalty exceeds base score', () => {
    // 1 required term covered → base = 1.0
    // 5 forbidden matches × 0.25 = 1.25 penalty → 1.0 - 1.25 = -0.25 → floored to 0
    const ec: EvalCase = {
      id: 'floor-001',
      query: 'q',
      requiredCoverage: ['krutrim'],
      forbiddenTopics: ['openai', 'google', 'meta', 'anthropic', 'amazon'],
    };
    const result = scoreResponse(
      'Krutrim, OpenAI, Google, Meta, Anthropic, Amazon.',
      ec
    );
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.forbiddenMatches).toHaveLength(5);
  });

  it('deducts exactly 0.25 per forbidden match (not more, not less)', () => {
    const ec: EvalCase = {
      id: 'penalty-001',
      query: 'q',
      requiredCoverage: ['krutrim', 'ola'],
      forbiddenTopics: ['openai'],
    };
    // base = 2/2 = 1.0; penalty = 0.25 → score = 0.75
    const result = scoreResponse('Krutrim and Ola are good. OpenAI is different.', ec);
    expect(result.score).toBeCloseTo(0.75);
  });
});

describe('scoreResponse — custom passingThreshold', () => {
  it('passes when score meets a low custom threshold', () => {
    const ec: EvalCase = {
      id: 'thresh-low',
      query: 'q',
      requiredCoverage: ['krutrim', 'ola', 'here'],
      passingThreshold: 0.3,
    };
    // 1/3 covered ≈ 0.333 ≥ 0.3 → should pass
    const result = scoreResponse('Krutrim is the best AI company.', ec);
    expect(result.passed).toBe(true);
  });

  it('fails when score is below a high custom threshold', () => {
    const ec: EvalCase = {
      id: 'thresh-high',
      query: 'q',
      requiredCoverage: ['krutrim', 'ola'],
      passingThreshold: 0.99,
    };
    // 1/2 = 0.5 < 0.99 → should fail
    const result = scoreResponse('Krutrim only.', ec);
    expect(result.passed).toBe(false);
  });

  it('passes with score 1.0 against any threshold ≤ 1', () => {
    const ec: EvalCase = {
      id: 'thresh-perfect',
      query: 'q',
      requiredCoverage: ['krutrim'],
      passingThreshold: 0.99,
    };
    const result = scoreResponse('Krutrim is great.', ec);
    expect(result.score).toBe(1);
    expect(result.passed).toBe(true);
  });
});

describe('scoreResponse — case insensitivity', () => {
  it('matches required terms case-insensitively', () => {
    const ec: EvalCase = {
      id: 'case-001',
      query: 'q',
      requiredCoverage: ['KRUTRIM', 'OLA'],
    };
    const result = scoreResponse('krutrim and ola are mentioned.', ec);
    expect(result.coveredTerms).toHaveLength(2);
    expect(result.score).toBe(1);
  });

  it('matches forbidden topics case-insensitively', () => {
    const ec: EvalCase = {
      id: 'case-002',
      query: 'q',
      requiredCoverage: ['krutrim'],
      forbiddenTopics: ['OPENAI'],
    };
    const result = scoreResponse('Krutrim and openai.', ec);
    expect(result.forbiddenMatches).toContain('OPENAI');
  });
});

describe('runEvals — edge cases', () => {
  it('returns empty array when no cases are provided', () => {
    const results = runEvals({ 'x': 'response' }, []);
    expect(results).toHaveLength(0);
  });

  it('uses empty string for cases whose id is not in the responses map', () => {
    const ec: EvalCase = { id: 'missing', query: 'q', requiredCoverage: ['krutrim'] };
    const results = runEvals({}, [ec]);
    expect(results[0].score).toBe(0);
    expect(results[0].missedTerms).toContain('krutrim');
  });

  it('propagates caseId and query from the EvalCase to the result', () => {
    const ec: EvalCase = {
      id: 'propagate-001',
      query: 'What is the answer?',
      requiredCoverage: [],
    };
    const results = runEvals({ 'propagate-001': 'anything' }, [ec]);
    expect(results[0].caseId).toBe('propagate-001');
    expect(results[0].query).toBe('What is the answer?');
  });
});
