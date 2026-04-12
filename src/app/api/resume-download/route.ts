import { NextRequest, NextResponse } from 'next/server';
import {
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  jsonError,
  captureAndLogApiError,
  logApiEvent,
  logApiWarning,
} from '@/lib/api';

const ROUTE = '/api/resume-download';

function safeReferrer(referrer: string): string {
  return referrer.replace(/[\r\n]/g, ' ').slice(0, 200);
}

export async function GET(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  try {
    const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
    if (rateLimited) return rateLimited;

    const referrer = safeReferrer(req.headers.get('referer') ?? 'direct');
    if (referrer.length >= 200) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'referer_too_long' });
    }
    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 307,
      durationMs: Date.now() - context.startedAt,
      hasReferer: referrer !== 'direct',
    });
    return finalizeApiResponse(NextResponse.redirect(new URL('/Prasad_Kavuri_Resume.pdf', req.url)), context);
  } catch (error) {
    captureAndLogApiError('api.request_failed', error, {
      route: ROUTE,
      traceId: context.traceId,
      status: 500,
      durationMs: Date.now() - context.startedAt,
    });
    return finalizeApiResponse(jsonError('Internal server error', 500, { context }), context);
  }
}
