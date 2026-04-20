/**
 * Eval engine — LLM-as-Judge scoring for portfolio assistant responses.
 *
 * Scores responses against ground-truth criteria without making real API calls.
 * Used by evals test suite to catch regression in prompt quality.
 */

import { recordSkillInvocation, createTraceId, createSpanId } from './observability';

export interface EvalCase {
  id: string;
  query: string;
  /** Keywords or phrases that MUST appear in a correct response. */
  requiredCoverage: string[];
  /** Topics or claims that must NOT appear in a correct response. */
  forbiddenTopics?: string[];
  /** Minimum score (0–1) to consider this case passing. Default: 0.7 */
  passingThreshold?: number;
}

export interface EvalResult {
  caseId: string;
  query: string;
  score: number;
  passed: boolean;
  coveredTerms: string[];
  missedTerms: string[];
  forbiddenMatches: string[];
  details: string;
}

/**
 * Score a model response against an eval case.
 *
 * Scoring:
 *  - Base score = covered / total required terms (0–1)
 *  - Each forbidden topic match deducts 0.25 (floor 0)
 */
export function scoreResponse(response: string, evalCase: EvalCase): EvalResult {
  const startTime = Date.now();
  const lower = response.toLowerCase();
  const threshold = evalCase.passingThreshold ?? 0.7;

  const coveredTerms: string[] = [];
  const missedTerms: string[] = [];

  for (const term of evalCase.requiredCoverage) {
    if (lower.includes(term.toLowerCase())) {
      coveredTerms.push(term);
    } else {
      missedTerms.push(term);
    }
  }

  const baseScore =
    evalCase.requiredCoverage.length === 0
      ? 1
      : coveredTerms.length / evalCase.requiredCoverage.length;

  const forbiddenMatches: string[] = [];
  for (const topic of evalCase.forbiddenTopics ?? []) {
    if (lower.includes(topic.toLowerCase())) {
      forbiddenMatches.push(topic);
    }
  }

  const penalty = forbiddenMatches.length * 0.25;
  const score = Math.max(0, baseScore - penalty);
  const passed = score >= threshold;

  const parts: string[] = [`score=${score.toFixed(2)}`];
  if (missedTerms.length) parts.push(`missed=[${missedTerms.join(', ')}]`);
  if (forbiddenMatches.length) parts.push(`forbidden=[${forbiddenMatches.join(', ')}]`);

  const result: EvalResult = {
    caseId: evalCase.id,
    query: evalCase.query,
    score,
    passed,
    coveredTerms,
    missedTerms,
    forbiddenMatches,
    details: parts.join(' | '),
  };

  recordSkillInvocation({
    traceId: createTraceId(),
    spanId: createSpanId(),
    skillId: 'eval-engine',
    skillName: 'Evaluation Engine',
    demoId: 'unknown',
    triggeredAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    outcome: passed ? 'pass' : 'error',
    meta: { score, caseId: evalCase.id },
  });

  return result;
}

/** Run a batch of eval cases and return all results. */
export function runEvals(
  responses: Record<string, string>,
  cases: EvalCase[]
): EvalResult[] {
  return cases.map(ec => {
    const response = responses[ec.id] ?? '';
    return scoreResponse(response, ec);
  });
}
