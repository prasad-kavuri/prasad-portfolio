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
import { startTimer } from '@/lib/observability';
import {
  getTeamPermissions,
  getTeamSpendConfigs,
  getUsageMetrics,
  getDailyTokenUsage,
  getRecentOtelEvents,
  getOrgSummary,
} from '@/lib/enterpriseMockData';

const ROUTE = '/api/enterprise-sim';
const VALID_RESOURCES = ['permissions', 'spend', 'usage', 'tokens', 'events', 'summary'] as const;
const VALID_PERIODS = ['7d', '30d', '90d'] as const;

type ValidPeriod = typeof VALID_PERIODS[number];

// Seeded artificial latency: 80–200ms
function seededDelay(): number {
  // Use a simple LCG seeded from the current second to get a consistent delay per second
  const s = Math.floor(Date.now() / 1000);
  const v = ((s * 1664525 + 1013904223) & 0xffffffff) >>> 0;
  return 80 + (v % 121); // 80–200ms
}

export async function GET(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const elapsed = startTimer();
  const { searchParams } = req.nextUrl;
  const resource = searchParams.get('resource') ?? '';

  // Keep rate limiting enabled while preventing test/browser fan-out from
  // sharing the same in-memory bucket for this read-only simulation route.
  const baseClient = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const clientKey = `${baseClient}|${resource || 'none'}|${req.headers.get('user-agent') ?? 'unknown'}`;
  const rateLimited = await enforceRateLimit(req, 'unknown', { context, clientKey });
  if (rateLimited) return rateLimited;
  const periodParam = searchParams.get('period') ?? '30d';
  const teamIdParam = searchParams.get('teamId') ?? '';
  const daysParam = searchParams.get('days') ?? '30';
  const limitParam = searchParams.get('limit') ?? '50';

  // Input length caps
  if (resource.length > 100 || periodParam.length > 100 || teamIdParam.length > 100) {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'param_too_long', status: 400 });
    return finalizeApiResponse(jsonError('Invalid request parameters', 400, { context }), context);
  }

  // Validate resource
  if (!VALID_RESOURCES.includes(resource as typeof VALID_RESOURCES[number])) {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_resource', resource, status: 400 });
    return finalizeApiResponse(jsonError('Invalid resource', 400, { context }), context);
  }

  // Validate period
  if (!VALID_PERIODS.includes(periodParam as ValidPeriod)) {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_period', period: periodParam, status: 400 });
    return finalizeApiResponse(jsonError('Invalid period — must be 7d, 30d, or 90d', 400, { context }), context);
  }
  const period = periodParam as ValidPeriod;

  // Parse numeric params
  const days = Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 90);
  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);

  try {
    // Simulate realistic API latency
    await new Promise(r => setTimeout(r, seededDelay()));

    const generatedAt = new Date().toISOString();

    let data: unknown;
    let totalRecords = 0;

    switch (resource) {
      case 'permissions': {
        const permissions = getTeamPermissions();
        data = permissions;
        totalRecords = permissions.length;
        break;
      }
      case 'spend': {
        const spend = getTeamSpendConfigs();
        data = spend;
        totalRecords = spend.length;
        break;
      }
      case 'usage': {
        const usage = getUsageMetrics();
        data = usage;
        totalRecords = usage.length;
        break;
      }
      case 'tokens': {
        const tokens = getDailyTokenUsage(teamIdParam || undefined, days);
        data = tokens;
        totalRecords = tokens.length;
        break;
      }
      case 'events': {
        const events = getRecentOtelEvents(limit);
        data = events;
        totalRecords = events.length;
        break;
      }
      case 'summary': {
        const summary = getOrgSummary(period);
        data = summary;
        totalRecords = 1;
        break;
      }
    }

    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs: elapsed(),
      resource,
    });

    return finalizeApiResponse(
      NextResponse.json({
        data,
        meta: { generatedAt, period, totalRecords },
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
    return finalizeApiResponse(jsonError('Internal server error', 500, { context }), context);
  }
}
