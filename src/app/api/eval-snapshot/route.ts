import { NextRequest, NextResponse } from 'next/server';
import {
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  jsonError,
  logApiEvent,
  captureAndLogApiError,
} from '@/lib/api';
import { getRecentQueries, getQueryCount } from '@/lib/query-log';
import { getDriftSnapshot } from '@/lib/drift-monitor';
import { runEvals } from '@/lib/eval-engine';

const ROUTE = '/api/eval-snapshot';

// Ground-truth eval cases run against live production responses
const LIVE_EVAL_CASES = [
  {
    id: 'portfolio_assistant_fidelity',
    query: 'Tell me about Prasad',
    requiredCoverage: ['krutrim', 'ola', 'here', 'agentic', 'ai'],
    passingThreshold: 0.7,
  },
  {
    id: 'portfolio_assistant_role',
    query: 'What is Prasad role',
    requiredCoverage: ['vp', 'head', 'engineering', 'ai'],
    passingThreshold: 0.6,
  },
];

export async function GET(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const rl = await enforceRateLimit(req, 'anonymous', { context });
  if (rl) return rl;

  try {
    const assistantQueries = getRecentQueries('/api/portfolio-assistant');
    const multiAgentQueries = getRecentQueries('/api/multi-agent');
    const totalQueries = getQueryCount();

    // Run eval-engine on the most recent portfolio-assistant responses
    const recentResponses: Record<string, string> = {};
    assistantQueries.slice(-5).forEach((q, i) => {
      recentResponses[`live_${i}`] = q.response;
    });

    const evalResults = Object.keys(recentResponses).length > 0
      ? runEvals(recentResponses, LIVE_EVAL_CASES)
      : [];

    const passCount = evalResults.filter(r => r.passed).length;
    const avgScore = evalResults.length > 0
      ? evalResults.reduce((sum, r) => sum + r.score, 0) / evalResults.length
      : null;

    const assistantDrift = getDriftSnapshot('/api/portfolio-assistant');
    const multiAgentDrift = getDriftSnapshot('/api/multi-agent');

    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs: Date.now() - context.startedAt,
      totalQueriesLogged: totalQueries,
      evalCasesRun: evalResults.length,
    });

    return finalizeApiResponse(NextResponse.json({
      totalQueriesLogged: totalQueries,
      assistantQueriesLogged: assistantQueries.length,
      multiAgentQueriesLogged: multiAgentQueries.length,
      liveEval: {
        casesRun: evalResults.length,
        passed: passCount,
        failed: evalResults.length - passCount,
        avgScore: avgScore !== null ? parseFloat(avgScore.toFixed(3)) : null,
      },
      drift: {
        assistantSamples: assistantDrift.length,
        multiAgentSamples: multiAgentDrift.length,
      },
      timestamp: new Date().toISOString(),
    }), context);
  } catch (error) {
    captureAndLogApiError('api.request_failed', error, {
      route: ROUTE,
      traceId: context.traceId,
      status: 500,
      durationMs: Date.now() - context.startedAt,
    });
    return finalizeApiResponse(jsonError('Snapshot unavailable', 500, { context }), context);
  }
}
