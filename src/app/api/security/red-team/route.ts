/**
 * Red-team report endpoint (SPEC-0023): runs the adversarial corpus against this portfolio's own
 * AI guardrails and agent and returns the summary. Deterministic and model-free, so every result
 * is reproducible and the route costs nothing to call.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createRequestContext, enforceRateLimit, finalizeApiResponse, logApiEvent } from '@/lib/api';
import { runRedTeam } from '@/lib/redteam/run';

const ROUTE = '/api/security/red-team';

export async function GET(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
  if (rateLimited) return rateLimited;

  const report = runRedTeam();
  logApiEvent('api.request_completed', {
    route: ROUTE, traceId: context.traceId, status: 200,
    attacksBlocked: report.totals.attacksBlocked, attacks: report.totals.attacks,
  });
  return finalizeApiResponse(NextResponse.json({ ...report, traceId: context.traceId }), context);
}
