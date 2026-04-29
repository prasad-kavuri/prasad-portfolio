import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import {
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  jsonError,
  captureAndLogApiError,
  logApiEvent,
  logApiWarning,
  readJsonObject,
} from '@/lib/api';
import { checkInput, sanitizeLLMOutput } from '@/lib/guardrails';
import { detectAnomaly, startTimer } from '@/lib/observability';

const ROUTE = '/api/edge-agent';
const MODEL = 'llama-3.3-70b-versatile';
const MAX_PAYLOAD_LENGTH = 2000;

export async function POST(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
  if (rateLimited) return rateLimited;

  const body = await readJsonObject(req, { context });
  if (!body.ok) return body.response;

  const { sanitizedPayload, approvedByUser } = body.data;

  // Enforce HITL gate server-side — client approval is not sufficient alone.
  if (approvedByUser !== true) {
    logApiWarning('api.hitl_gate_blocked', {
      route: ROUTE,
      traceId: context.traceId,
      reason: 'user_not_approved',
      status: 400,
    });
    return finalizeApiResponse(
      jsonError('Human approval required before cloud handoff', 400, { context }),
      context
    );
  }

  if (!sanitizedPayload || typeof sanitizedPayload !== 'string') {
    logApiWarning('api.validation_failed', {
      route: ROUTE,
      traceId: context.traceId,
      reason: 'missing_payload',
      status: 400,
    });
    return finalizeApiResponse(
      jsonError('sanitizedPayload is required', 400, { context }),
      context
    );
  }

  const payload = sanitizedPayload.trim();
  if (payload.length === 0) {
    logApiWarning('api.validation_failed', {
      route: ROUTE,
      traceId: context.traceId,
      reason: 'empty_payload',
      status: 400,
    });
    return finalizeApiResponse(
      jsonError('sanitizedPayload cannot be empty', 400, { context }),
      context
    );
  }

  if (payload.length > MAX_PAYLOAD_LENGTH) {
    logApiWarning('api.abnormal_usage', {
      route: ROUTE,
      traceId: context.traceId,
      reason: 'payload_too_long',
      payloadLength: payload.length,
      status: 400,
    });
    return finalizeApiResponse(
      jsonError('Payload too long', 400, { context }),
      context
    );
  }

  const inputCheck = checkInput(payload);
  if (!inputCheck.isSafe) {
    logApiWarning('api.guardrail_input_triggered', {
      route: ROUTE,
      traceId: context.traceId,
      issues: inputCheck.issues.join(','),
      status: 400,
    });
    return finalizeApiResponse(
      jsonError('Invalid input', 400, { context }),
      context
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    captureAndLogApiError('api.configuration_error', new Error('Missing GROQ_API_KEY'), {
      route: ROUTE,
      traceId: context.traceId,
      status: 500,
    });
    return finalizeApiResponse(
      jsonError('Service not configured', 500, { context }),
      context
    );
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
            'You are an enterprise AI assistant. The payload you receive has already been privacy-screened: all PII has been redacted at the edge before reaching you. Produce a concise executive summary (3-5 sentences) of the business request. Focus on the action being requested, the business context, and any timeline or budget signals.',
        },
        {
          role: 'user',
          content: payload,
        },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });

    const durationMs = elapsed();
    const rawSummary = completion.choices[0]?.message?.content ?? '';
    const summary = sanitizeLLMOutput(rawSummary);

    const anomaly = detectAnomaly(durationMs, 200);
    if (anomaly.anomaly) {
      logApiWarning('api.anomaly_detected', {
        route: ROUTE,
        traceId: context.traceId,
        reasons: anomaly.reasons.join(', '),
        durationMs,
        status: 200,
      });
    }

    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs,
      model: MODEL,
    });

    return finalizeApiResponse(
      NextResponse.json({
        summary,
        traceId: context.traceId,
        tier: 'cloud' as const,
        model: MODEL,
      }),
      context
    );
  } catch (error) {
    captureAndLogApiError('api.request_failed', error, {
      route: ROUTE,
      traceId: context.traceId,
      status: 502,
      durationMs: elapsed(),
    });
    return finalizeApiResponse(
      jsonError('Cloud agent request failed', 502, { context }),
      context
    );
  }
}
