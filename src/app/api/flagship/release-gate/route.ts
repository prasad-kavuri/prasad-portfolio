/**
 * Release gate for the flagship agent (SPEC-0021): runs trajectory evaluation of the production
 * revision and the canary candidate over the golden scenarios and returns promote / rollback.
 * Deterministic and model-free, so it is cheap to call and every result is reproducible.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createRequestContext, enforceRateLimit, finalizeApiResponse, logApiEvent } from '@/lib/api';
import { evaluateRelease } from '@/lib/flagship/trajectory-eval';

const ROUTE = '/api/flagship/release-gate';

export async function GET(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
  if (rateLimited) return rateLimited;

  const gate = evaluateRelease();
  logApiEvent('api.request_completed', { route: ROUTE, traceId: context.traceId, status: 200, decision: gate.decision });
  return finalizeApiResponse(NextResponse.json({ ...gate, traceId: context.traceId }), context);
}
