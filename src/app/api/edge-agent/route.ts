import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import {
  enforceDailyBudget,
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  jsonError,
  captureAndLogApiError,
  logApiEvent,
  logApiWarning,
  readJsonObject,
  type RequestContext,
} from '@/lib/api';
import { checkInput, detectStructuredPII, sanitizeLLMOutput } from '@/lib/guardrails';
import { detectAnomaly, startTimer } from '@/lib/observability';
import { APPROVAL_ERROR_MESSAGES, createPendingApproval, decideApproval } from '@/lib/approvals';

const ROUTE = '/api/edge-agent';
const MODEL = 'llama-3.3-70b-versatile';
const MAX_PAYLOAD_LENGTH = 2000;
const APPROVAL_KIND = 'edge-agent.cloud-handoff' as const;

interface StagedHandoff {
  payload: string;
}

/**
 * Two-step, server-enforced handoff (SPEC-0020):
 *   1. { action: 'stage', sanitizedPayload } — the server re-checks the browser-redacted payload for
 *      structured PII, then stores it as a pending approval. Nothing is sent to the cloud model.
 *   2. { action: 'approve' | 'reject', approvalId } — consumes the pending approval exactly once.
 *      Only 'approve' calls the cloud model, and only with the payload that was staged and shown.
 */
export async function POST(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
  if (rateLimited) return rateLimited;

  const body = await readJsonObject(req, { context });
  if (!body.ok) return body.response;

  const { action } = body.data;
  if (action === 'stage') return stageHandoff(body.data.sanitizedPayload, context);
  if (action === 'approve' || action === 'reject') {
    return decideHandoff(body.data.approvalId, action, context);
  }

  logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_action', status: 400 });
  return finalizeApiResponse(
    jsonError('action must be one of: stage, approve, reject', 400, { context }),
    context
  );
}

async function stageHandoff(sanitizedPayload: unknown, context: RequestContext) {
  if (!sanitizedPayload || typeof sanitizedPayload !== 'string') {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'missing_payload', status: 400 });
    return finalizeApiResponse(jsonError('sanitizedPayload is required', 400, { context }), context);
  }

  const payload = sanitizedPayload.trim();
  if (payload.length === 0) {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'empty_payload', status: 400 });
    return finalizeApiResponse(jsonError('sanitizedPayload cannot be empty', 400, { context }), context);
  }

  if (payload.length > MAX_PAYLOAD_LENGTH) {
    logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'payload_too_long', payloadLength: payload.length, status: 400 });
    return finalizeApiResponse(jsonError('Payload too long', 400, { context }), context);
  }

  const inputCheck = checkInput(payload);
  if (!inputCheck.isSafe) {
    logApiWarning('api.guardrail_input_triggered', { route: ROUTE, traceId: context.traceId, issues: inputCheck.issues.join(','), status: 400 });
    return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
  }

  // Server-side backstop: never trust that the browser redacted everything.
  const piiTypes = detectStructuredPII(payload);
  if (piiTypes.length > 0) {
    logApiWarning('api.pii_boundary_blocked', { route: ROUTE, traceId: context.traceId, piiTypes: piiTypes.join(','), status: 422 });
    return finalizeApiResponse(
      NextResponse.json(
        {
          error: 'Handoff blocked: the payload still contains personal data. Redact it before sending to the cloud.',
          piiTypes,
          traceId: context.traceId,
        },
        { status: 422 }
      ),
      context,
      422
    );
  }

  const pending = await createPendingApproval<StagedHandoff>(APPROVAL_KIND, { payload }, context.traceId);
  logApiEvent('api.approval_staged', { route: ROUTE, traceId: context.traceId, status: 200, approvalId: pending.approvalId });

  return finalizeApiResponse(
    NextResponse.json({
      status: 'pending_approval',
      approvalId: pending.approvalId,
      expiresAt: pending.expiresAt,
      payloadHash: pending.payloadHash,
      serverCheck: { structuredPii: [], passed: true },
      traceId: context.traceId,
    }),
    context
  );
}

async function decideHandoff(approvalId: unknown, action: 'approve' | 'reject', context: RequestContext) {
  const decided = await decideApproval<StagedHandoff>(APPROVAL_KIND, approvalId, action === 'approve' ? 'approved' : 'rejected');
  if (!decided.ok) {
    logApiWarning('api.approval_rejected', { route: ROUTE, traceId: context.traceId, reason: decided.code, status: decided.status });
    return finalizeApiResponse(jsonError(APPROVAL_ERROR_MESSAGES[decided.code], decided.status, { context }), context);
  }

  logApiEvent('api.approval_decided', {
    route: ROUTE,
    traceId: context.traceId,
    status: 200,
    approvalId: decided.receipt.approvalId,
    decision: decided.receipt.decision,
  });

  if (action === 'reject') {
    return finalizeApiResponse(
      NextResponse.json({ status: 'rejected', receipt: decided.receipt, traceId: context.traceId }),
      context
    );
  }

  const payload = decided.pending.payload.payload;

  const overBudget = await enforceDailyBudget(context);
  if (overBudget) return overBudget;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    captureAndLogApiError('api.configuration_error', new Error('Missing GROQ_API_KEY'), { route: ROUTE, traceId: context.traceId, status: 500 });
    return finalizeApiResponse(jsonError('Service not configured', 500, { context }), context);
  }

  const groq = new Groq({ apiKey });
  const elapsed = startTimer();

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an enterprise AI assistant. The payload you receive has already been privacy-screened: PII was redacted at the edge and re-checked on the server before reaching you. Produce a concise executive summary (3-5 sentences) of the business request. Focus on the action being requested, the business context, and any timeline or budget signals.',
        },
        { role: 'user', content: payload },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });

    const durationMs = elapsed();
    const rawSummary = completion.choices[0]?.message?.content ?? '';
    const summary = sanitizeLLMOutput(rawSummary);

    const anomaly = detectAnomaly(durationMs, 200);
    if (anomaly.anomaly) {
      logApiWarning('api.anomaly_detected', { route: ROUTE, traceId: context.traceId, reasons: anomaly.reasons.join(', '), durationMs, status: 200 });
    }

    logApiEvent('api.request_completed', { route: ROUTE, traceId: context.traceId, status: 200, durationMs, model: MODEL });

    return finalizeApiResponse(
      NextResponse.json({
        summary,
        traceId: context.traceId,
        tier: 'cloud' as const,
        model: MODEL,
        receipt: decided.receipt,
      }),
      context
    );
  } catch (error) {
    captureAndLogApiError('api.request_failed', error, { route: ROUTE, traceId: context.traceId, status: 502, durationMs: elapsed() });
    return finalizeApiResponse(jsonError('Cloud agent request failed', 502, { context }), context);
  }
}
