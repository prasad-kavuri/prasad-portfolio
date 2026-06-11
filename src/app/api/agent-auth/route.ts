import { NextRequest } from 'next/server';
import {
  issueToken,
  generateOtp,
  generateRandomHex,
  storeClaimEntry,
  popClaimEntry,
  DEMO_SCOPES,
  ANON_TTL_S,
  CLAIM_TTL_S,
  CLAIMED_TTL_S,
} from '@/lib/agent-auth';
import {
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  jsonError,
  logApiEvent,
  logApiWarning,
  readJsonObject,
} from '@/lib/api';
import { startTimer, logAPIEvent } from '@/lib/observability';

const ROUTE = '/api/agent-auth';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_RE = /^\d{6}$/;

export async function POST(request: NextRequest) {
  const context = createRequestContext(request, ROUTE);
  const rateLimited = await enforceRateLimit(request, 'anonymous', { context });
  if (rateLimited) return rateLimited;

  const elapsed = startTimer();

  const body = await readJsonObject(request, { context });
  if (!body.ok) return body.response;

  const { type } = body.data;

  if (!type || typeof type !== 'string') {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'missing_type', status: 400 });
    return finalizeApiResponse(jsonError('type is required', 400, { context }), context);
  }

  // ── anonymous_start ──────────────────────────────────────────────────────
  if (type === 'anonymous_start') {
    const claimToken = generateRandomHex(16);
    const token = await issueToken(
      { sub: `anon-${generateRandomHex(8)}`, type: 'anonymous', scopes: DEMO_SCOPES },
      ANON_TTL_S,
    );

    logApiEvent('api.request_completed', { route: ROUTE, traceId: context.traceId, status: 200, durationMs: elapsed(), action: 'anonymous_start' });

    return finalizeApiResponse(Response.json({
      credential: token,
      type: 'anonymous',
      scopes: DEMO_SCOPES,
      expires_in: ANON_TTL_S,
      claim_token: claimToken,
      claim_endpoint: 'https://www.prasadkavuri.com/api/agent-auth',
      _meta: { anon_token_stored: claimToken },
    }), context);
  }

  // ── claim_init ───────────────────────────────────────────────────────────
  if (type === 'claim_init') {
    const { claim_token: claimToken, email } = body.data;

    if (!claimToken || typeof claimToken !== 'string' || claimToken.length > 64) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_claim_token', status: 400 });
      return finalizeApiResponse(jsonError('claim_token is required', 400, { context }), context);
    }
    if (!email || typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email)) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_email', status: 400 });
      return finalizeApiResponse(jsonError('Valid email is required', 400, { context }), context);
    }

    const otp = generateOtp();
    const claimId = generateRandomHex(16);

    await storeClaimEntry(claimId, {
      otp,
      email,
      anonToken: claimToken,
      expiresAt: Date.now() + CLAIM_TTL_S * 1000,
    });

    logApiEvent('api.request_completed', { route: ROUTE, traceId: context.traceId, status: 200, durationMs: elapsed(), action: 'claim_init' });

    return finalizeApiResponse(Response.json({
      claim_id: claimId,
      otp_delivery: 'demo_inline',
      otp,
      message: 'OTP shown inline (demo mode). In production this would be emailed.',
      expires_in: CLAIM_TTL_S,
    }), context);
  }

  // ── claim_complete ───────────────────────────────────────────────────────
  if (type === 'claim_complete') {
    const { claim_id: claimId, otp } = body.data;

    if (!claimId || typeof claimId !== 'string' || claimId.length > 64) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_claim_id', status: 400 });
      return finalizeApiResponse(jsonError('claim_id is required', 400, { context }), context);
    }
    if (!otp || typeof otp !== 'string' || !OTP_RE.test(otp)) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_otp_format', status: 400 });
      return finalizeApiResponse(jsonError('otp must be 6 digits', 400, { context }), context);
    }

    const entry = await popClaimEntry(claimId);
    if (!entry) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'claim_not_found_or_expired', status: 410 });
      return finalizeApiResponse(jsonError('OTP expired or already used', 410, { context }), context);
    }
    if (entry.expiresAt < Date.now()) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'claim_expired', status: 410 });
      return finalizeApiResponse(jsonError('OTP expired', 410, { context }), context);
    }
    if (entry.otp !== otp) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'otp_mismatch', status: 401 });
      return finalizeApiResponse(jsonError('Invalid OTP', 401, { context }), context);
    }

    const claimedToken = await issueToken(
      { sub: entry.email, type: 'claimed', scopes: DEMO_SCOPES, email: entry.email },
      CLAIMED_TTL_S,
    );

    logAPIEvent({ event: 'api.request_completed', route: ROUTE, traceId: context.traceId, severity: 'info', durationMs: elapsed(), statusCode: 200, action: 'claim_complete' });

    return finalizeApiResponse(Response.json({
      credential: claimedToken,
      type: 'claimed',
      email: entry.email,
      scopes: DEMO_SCOPES,
      expires_in: CLAIMED_TTL_S,
    }), context);
  }

  logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'unknown_type', status: 400 });
  return finalizeApiResponse(
    jsonError(`Unknown type: ${String(type).slice(0, 32)}. Valid: anonymous_start | claim_init | claim_complete`, 400, { context }),
    context,
  );
}
