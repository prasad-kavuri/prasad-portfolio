import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, type RateLimitResult } from '@/lib/rate-limit';
import {
  captureAPIError,
  categorizeError,
  createTraceId,
  detectUsageAnomaly,
  logAPIEvent,
  logStructuredRequest,
  trackAPIRequest,
  trackRateLimit,
} from '@/lib/observability';

export type JsonObject = Record<string, unknown>;
export type LogLevel = 'info' | 'warn' | 'error';

type JsonBodyResult =
  | { ok: true; data: JsonObject }
  | { ok: false; response: NextResponse };

type LogMeta = Record<string, boolean | number | string | null | undefined>;

export interface RequestContext {
  route: string;
  method: string;
  traceId: string;
  startedAt: number;
  userHash?: string;
  rateLimit?: RateLimitResult;
}

type RequestMeta = {
  route?: string;
  traceId?: string;
  context?: RequestContext;
};

const LOG_IP_SALT = process.env.LOG_IP_SALT ?? 'portfolio-api';

function cleanLogMeta(meta: LogMeta = {}): LogMeta {
  return Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined)
  );
}

async function hashLogValue(value: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${LOG_IP_SALT}:${value}`)
  );
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function writeLog(level: LogLevel, event: string, meta: LogMeta = {}): void {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...cleanLogMeta(meta),
  };

  const message = JSON.stringify(entry);
  if (level === 'error') {
    console.error(message);
  } else if (level === 'warn') {
    console.warn(message);
  } else {
    console.info(message);
  }
}

export function logApiEvent(event: string, meta: LogMeta = {}): void {
  writeLog('info', event, meta);
}

export function logApiWarning(event: string, meta: LogMeta = {}): void {
  writeLog('warn', event, meta);
}

export function logApiError(event: string, error: unknown, meta: LogMeta = {}): void {
  writeLog('error', event, {
    ...meta,
    errorName: error instanceof Error ? error.name : typeof error,
  });
}

export function createRequestContext(req: NextRequest, route: string): RequestContext {
  return {
    route,
    method: req.method,
    traceId: createTraceId(
      req.headers.get('x-request-id') ?? req.headers.get('x-trace-id')
    ),
    startedAt: Date.now(),
  };
}

function rateLimitHeaders(result?: RateLimitResult): Record<string, string> {
  if (!result) return {};

  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

function traceHeaders(meta: RequestMeta = {}): Record<string, string> {
  const traceId = meta.context?.traceId ?? meta.traceId;
  return traceId ? { 'X-Request-Id': traceId, 'X-Trace-Id': traceId } : {};
}

export function finalizeApiResponse(
  response: Response,
  context: RequestContext,
  statusCode = response.status
): Response {
  const durationMs = Date.now() - context.startedAt;
  response.headers.set('X-Request-Id', context.traceId);
  response.headers.set('X-Trace-Id', context.traceId);
  response.headers.set('Server-Timing', `app;dur=${durationMs}`);

  for (const [key, value] of Object.entries(rateLimitHeaders(context.rateLimit))) {
    response.headers.set(key, value);
  }

  trackAPIRequest(context.route, statusCode);
  logStructuredRequest({
    requestId: context.traceId,
    route: context.route,
    status: statusCode,
    latency: durationMs,
    errorType: categorizeError(statusCode),
    userHash: context.userHash,
  });
  const usageAnomaly = detectUsageAnomaly(context.route, statusCode, context.userHash);
  if (usageAnomaly.anomaly) {
    logAPIEvent({
      event: 'api.usage_anomaly',
      route: context.route,
      requestId: context.traceId,
      traceId: context.traceId,
      severity: 'warn',
      status: statusCode,
      latency: durationMs,
      userHash: context.userHash,
      reasons: usageAnomaly.reasons.join('; '),
    });
  }
  return response;
}

export function jsonError(error: string, status: number, meta: RequestMeta = {}): NextResponse {
  return NextResponse.json(
    { error, requestId: meta.context?.traceId ?? meta.traceId },
    {
      status,
      headers: {
        ...traceHeaders(meta),
        ...rateLimitHeaders(meta.context?.rateLimit),
      },
    }
  );
}

export function getClientIp(req: NextRequest, fallback = 'anonymous'): string {
  return (
    req.headers.get('x-forwarded-for') ??
    req.headers.get('x-real-ip') ??
    fallback
  );
}

export async function enforceRateLimit(
  req: NextRequest,
  fallback = 'anonymous',
  meta: RequestMeta = {}
): Promise<NextResponse | null> {
  const clientIp = getClientIp(req, fallback);
  const userHash = await hashLogValue(clientIp.split(',')[0].trim());
  const result = await rateLimit(clientIp);
  if (meta.context) {
    meta.context.rateLimit = result;
    meta.context.userHash = userHash;
  }

  trackRateLimit(meta.context?.route ?? meta.route ?? 'unknown', result.limited);

  if (result.limited) {
    logApiWarning('api.rate_limited', {
      route: meta.context?.route ?? meta.route,
      traceId: meta.context?.traceId ?? meta.traceId,
      method: req.method,
      clientHash: userHash,
      userHash,
      limit: result.limit,
      remaining: result.remaining,
    });
    const response = jsonError('Too many requests', 429, meta);
    return meta.context ? finalizeApiResponse(response, meta.context, 429) as NextResponse : response;
  }
  return null;
}

export async function readJsonObject(
  req: NextRequest,
  meta: RequestMeta = {}
): Promise<JsonBodyResult> {
  let data: unknown;
  try {
    data = await req.json();
  } catch {
    logApiWarning('api.invalid_json', {
      route: meta.context?.route ?? meta.route,
      traceId: meta.context?.traceId ?? meta.traceId,
      method: req.method,
    });
    const response = jsonError('Invalid JSON body', 400, meta);
    return {
      ok: false,
      response: meta.context ? finalizeApiResponse(response, meta.context, 400) as NextResponse : response,
    };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    logApiWarning('api.invalid_json_shape', {
      route: meta.context?.route ?? meta.route,
      traceId: meta.context?.traceId ?? meta.traceId,
      method: req.method,
      bodyType: Array.isArray(data) ? 'array' : typeof data,
    });
    return {
      ok: false,
      response: meta.context
        ? finalizeApiResponse(jsonError('Request body must be a JSON object', 400, meta), meta.context, 400) as NextResponse
        : jsonError('Request body must be a JSON object', 400, meta),
    };
  }

  return { ok: true, data: data as JsonObject };
}

export function isStringArray(
  value: unknown,
  options: { maxItems?: number; maxItemLength?: number } = {}
): value is string[] {
  if (!Array.isArray(value)) return false;
  if (options.maxItems !== undefined && value.length > options.maxItems) return false;
  return value.every(item => (
    typeof item === 'string' &&
    (options.maxItemLength === undefined || item.length <= options.maxItemLength)
  ));
}

export function captureAndLogApiError(event: string, error: unknown, meta: LogMeta & { route: string; status?: number; durationMs?: number; traceId?: string }): void {
  logApiError(event, error, meta);
  captureAPIError(error, {
    route: meta.route,
    traceId: meta.traceId,
    durationMs: meta.durationMs,
    statusCode: meta.status ?? 500,
    errorType: categorizeError(meta.status ?? 500, event),
  });
}
