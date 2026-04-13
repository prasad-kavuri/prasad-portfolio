import { NextRequest, NextResponse } from 'next/server';
import {
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  jsonError,
  captureAndLogApiError,
  logApiEvent,
} from '@/lib/api';
import { startTimer, logAPIEvent } from '@/lib/observability';
import { scoreResponse } from '@/lib/eval-engine';
import { checkInput, checkOutput } from '@/lib/guardrails';

const ROUTE = '/api/evaluation-showcase';

// Ground truth for evaluation
const EVAL_CASE = {
  id: 'showcase',
  query: 'portfolio evaluation',
  requiredCoverage: ['krutrim', 'ola', 'here', 'agentic', 'ai'],
  forbiddenTopics: ['lead manager', "i don't know", '5 years'],
  passingThreshold: 0.7,
};

export async function POST(request: NextRequest) {
  const context = createRequestContext(request, ROUTE);
  const elapsed = startTimer();
  try {
    const limited = await enforceRateLimit(request, 'anonymous', { context });
    if (limited) return limited;

    let body: { query?: unknown; mockResponse?: unknown };
    try {
      body = await request.json();
    } catch {
      return finalizeApiResponse(jsonError('Invalid JSON', 400, { context }), context);
    }

    const { query, mockResponse } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
    }
    if (query.length > 2000) {
      return finalizeApiResponse(jsonError('Input too long', 400, { context }), context);
    }
    if (mockResponse !== undefined && typeof mockResponse !== 'string') {
      return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
    }

    // Step 1: Guardrail the input
    const inputGuard = checkInput(query);
    if (!inputGuard.isSafe) {
      return finalizeApiResponse(
        NextResponse.json(
          { error: 'Input blocked by guardrails', issues: inputGuard.issues },
          { status: 400 }
        ),
        context
      );
    }

    // Step 2: Score the response (use mockResponse if provided, else query)
    const responseToEval = typeof mockResponse === 'string' ? mockResponse : query;
    const evalResult = scoreResponse(responseToEval, EVAL_CASE);

    // Step 3: Guardrail the output
    const outputGuard = checkOutput(responseToEval, context.traceId);

    // Step 4: Calculate final eval result
    const hallucinationScore =
      evalResult.forbiddenMatches.length /
      Math.max(EVAL_CASE.forbiddenTopics.length, 1);
    const passed = evalResult.score >= 0.7 && outputGuard.isSafe;

    const durationMs = elapsed();
    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs,
      fidelityScore: evalResult.score,
      passed,
    });
    logAPIEvent({
      event: 'eval.completed',
      route: ROUTE,
      traceId: context.traceId,
      severity: 'info',
      durationMs,
      statusCode: 200,
      fidelityScore: evalResult.score,
      guardrailScore: outputGuard.score,
    });

    return finalizeApiResponse(
      NextResponse.json({
        fidelityScore: evalResult.score.toFixed(2),
        topicsCovered: evalResult.coveredTerms,
        topicsMissed: evalResult.missedTerms,
        hallucinationScore: hallucinationScore.toFixed(2),
        guardrailScore: outputGuard.score.toFixed(2),
        guardrailIssues: outputGuard.issues,
        passed,
        verdict: passed ? '✅ Passed — safe to ship' : '❌ Failed — review required',
        traceId: context.traceId,
        regressionDelta: '+0.00',
      }),
      context
    );
  } catch (error) {
    captureAndLogApiError('api.request_failed', error, {
      route: ROUTE,
      traceId: context.traceId,
      status: 500,
      durationMs: elapsed(),
    });
    return finalizeApiResponse(jsonError('Evaluation failed', 500, { context }), context);
  }
}
