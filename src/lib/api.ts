import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export type JsonObject = Record<string, unknown>;
export type LogLevel = 'info' | 'warn' | 'error';

type JsonBodyResult =
  | { ok: true; data: JsonObject }
  | { ok: false; response: NextResponse };

type LogMeta = Record<string, boolean | number | string | null | undefined>;

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

export function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
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
  meta: { route?: string } = {}
): Promise<NextResponse | null> {
  const clientIp = getClientIp(req, fallback);
  if ((await rateLimit(clientIp)).limited) {
    logApiWarning('api.rate_limited', {
      route: meta.route,
      method: req.method,
      clientHash: await hashLogValue(clientIp.split(',')[0].trim()),
    });
    return jsonError('Too many requests', 429);
  }
  return null;
}

export async function readJsonObject(
  req: NextRequest,
  meta: { route?: string } = {}
): Promise<JsonBodyResult> {
  let data: unknown;
  try {
    data = await req.json();
  } catch {
    logApiWarning('api.invalid_json', {
      route: meta.route,
      method: req.method,
    });
    return { ok: false, response: jsonError('Invalid JSON body', 400) };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    logApiWarning('api.invalid_json_shape', {
      route: meta.route,
      method: req.method,
      bodyType: Array.isArray(data) ? 'array' : typeof data,
    });
    return {
      ok: false,
      response: jsonError('Request body must be a JSON object', 400),
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
