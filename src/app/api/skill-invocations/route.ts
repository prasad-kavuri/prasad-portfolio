import { NextRequest, NextResponse } from 'next/server';
import { getRecentSkillInvocations } from '@/lib/observability';
import {
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  logApiEvent,
} from '@/lib/api';

const ROUTE = 'api.skill-invocations';

export async function GET(request: Request) {
  // Next.js passes NextRequest at runtime; cast for api.ts helpers
  const req = request as unknown as NextRequest;
  const context = createRequestContext(req, ROUTE);
  const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 50);
  const invocations = getRecentSkillInvocations(limit);

  logApiEvent('api.request_completed', {
    route: ROUTE,
    traceId: context.traceId,
    status: 200,
    durationMs: Date.now() - context.startedAt,
    count: invocations.length,
  });

  return finalizeApiResponse(
    NextResponse.json({
      invocations,
      bufferedCount: getRecentSkillInvocations(50).length,
    }),
    context
  ) as NextResponse;
}
