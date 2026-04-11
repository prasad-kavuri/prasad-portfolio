import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export type JsonObject = Record<string, unknown>;

type JsonBodyResult =
  | { ok: true; data: JsonObject }
  | { ok: false; response: NextResponse };

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
  fallback = 'anonymous'
): Promise<NextResponse | null> {
  if ((await rateLimit(getClientIp(req, fallback))).limited) {
    return jsonError('Too many requests', 429);
  }
  return null;
}

export async function readJsonObject(req: NextRequest): Promise<JsonBodyResult> {
  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return { ok: false, response: jsonError('Invalid JSON body', 400) };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
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
