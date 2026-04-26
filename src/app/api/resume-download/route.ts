import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
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
const NEW_PDF = 'prasad-kavuri-vp-ai-engineering-2026.pdf';
const LEGACY_PDF = 'Prasad_Kavuri_Resume.pdf';

function resolveResumePath(): string {
  const newPath = join(process.cwd(), 'public', NEW_PDF);
  return existsSync(newPath) ? NEW_PDF : LEGACY_PDF;
}

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

    const fileName = resolveResumePath();
    const filePath = join(process.cwd(), 'public', fileName);
    const fileBuffer = readFileSync(filePath);

    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs: Date.now() - context.startedAt,
      hasReferer: referrer !== 'direct',
    });

    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="prasad-kavuri-vp-ai-engineering-2026.pdf"`,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
    return finalizeApiResponse(response, context);
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
