import { NextRequest, NextResponse } from 'next/server';
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
import { isPromptInjection, checkOutput, sanitizeLLMOutput } from '@/lib/guardrails';

const ROUTE = '/api/qwen-moe';
const QWEN_ENDPOINT = 'http://localhost:8000/v1/chat/completions';
const QWEN_MODEL = 'qwen3-35b-a3b-int4';
const FALLBACK_MESSAGE =
  'Qwen MoE local inference unavailable — requires local vllm server. ' +
  'This demo shows the routing architecture; switch to Llama or Mixtral for live output.';

export async function POST(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const rateLimited = await enforceRateLimit(req, 'unknown', { context });
  if (rateLimited) return rateLimited;

  const body = await readJsonObject(req, { context });
  if (!body.ok) return body.response;

  const { prompt } = body.data;

  if (!prompt || typeof prompt !== 'string') {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'missing_prompt', status: 400 });
    return finalizeApiResponse(jsonError('Prompt is required', 400, { context }), context);
  }
  if (prompt.length > 500) {
    logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'prompt_too_long', status: 400 });
    return finalizeApiResponse(jsonError('Input too long', 400, { context }), context);
  }
  if (isPromptInjection(prompt)) {
    logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'prompt_injection', status: 400 });
    return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
  }

  try {
    const start = Date.now();
    const res = await fetch(QWEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      throw new Error(`vllm returned ${res.status}`);
    }

    const data = await res.json() as {
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawContent = data.choices?.[0]?.message?.content ?? '';
    const guardResult = checkOutput(rawContent, context.traceId);
    const totalDuration = Date.now() - context.startedAt;

    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs: totalDuration,
      upstreamLatencyMs: latency,
      model: QWEN_MODEL,
    });

    return finalizeApiResponse(NextResponse.json({
      model: 'qwen-moe-local',
      modelName: 'Qwen 3.6 MoE (int4) — Edge Efficient',
      provider: 'Local vllm · localhost:8000',
      response: sanitizeLLMOutput(guardResult.sanitizedOutput ?? rawContent),
      latency_ms: latency,
      input_tokens: data.usage?.prompt_tokens ?? 0,
      output_tokens: data.usage?.completion_tokens ?? 0,
      cost_usd: 0,
      isFallback: false,
    }), context);
  } catch (err) {
    const durationMs = Date.now() - context.startedAt;
    // localhost:8000 absent in production is expected — log as info, not error
    if (err instanceof Error && (err.name === 'TimeoutError' || err.message.includes('fetch'))) {
      logApiEvent('api.request_completed', {
        route: ROUTE,
        traceId: context.traceId,
        status: 200,
        durationMs,
        model: QWEN_MODEL,
        note: 'local_vllm_unavailable',
      });
    } else {
      captureAndLogApiError('api.request_failed', err, { route: ROUTE, traceId: context.traceId, status: 200, durationMs });
    }

    return finalizeApiResponse(NextResponse.json({
      model: 'qwen-moe-local',
      modelName: 'Qwen 3.6 MoE (int4) — Edge Efficient',
      provider: 'Local vllm · localhost:8000',
      response: '',
      latency_ms: durationMs,
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      isFallback: true,
      error: FALLBACK_MESSAGE,
    }), context);
  }
}
