import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit, jsonError, logApiError, logApiEvent, logApiWarning } from '@/lib/api';

const ROUTE = '/api/resume-download';

function safeReferrer(referrer: string): string {
  return referrer.replace(/[\r\n]/g, ' ').slice(0, 200);
}

export async function GET(req: NextRequest) {
  const requestStart = Date.now();
  try {
    const rateLimited = await enforceRateLimit(req, 'anonymous', { route: ROUTE });
    if (rateLimited) return rateLimited;

    const referrer = safeReferrer(req.headers.get('referer') ?? 'direct');
    if (referrer.length >= 200) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, reason: 'referer_too_long' });
    }
    logApiEvent('api.request_completed', {
      route: ROUTE,
      status: 307,
      durationMs: Date.now() - requestStart,
      hasReferer: referrer !== 'direct',
    });
    return NextResponse.redirect(new URL('/Prasad_Kavuri_Resume.pdf', req.url));
  } catch (error) {
    logApiError('api.request_failed', error, {
      route: ROUTE,
      status: 500,
      durationMs: Date.now() - requestStart,
    });
    return jsonError('Internal server error', 500);
  }
}
