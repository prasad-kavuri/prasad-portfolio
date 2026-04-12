import { NextRequest, NextResponse } from 'next/server';
import { detectPromptInjection, sanitizeLLMOutput } from '@/lib/rate-limit';
import {
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  getClientIp,
  jsonError,
  captureAndLogApiError,
  logApiEvent,
  logApiWarning,
  readJsonObject,
} from '@/lib/api';
import { detectAnomaly, logAPIEvent } from '@/lib/observability';
import { enforceCostControls } from '@/lib/cost-control';

const ROUTE = '/api/llm-router';

const MAX_RETRIES = 1;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attemptsLeft = MAX_RETRIES
): Promise<Response> {
  const res = await fetch(url, options);
  if (!res.ok && res.status >= 500 && attemptsLeft > 0) {
    return fetchWithRetry(url, options, attemptsLeft - 1);
  }
  return res;
}

const MODELS = [
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Meta', inputCost: 0.05, outputCost: 0.08 },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Meta', inputCost: 0.59, outputCost: 0.79 },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', provider: 'Meta', inputCost: 0.11, outputCost: 0.34 },
  { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', provider: 'Alibaba', inputCost: 0.29, outputCost: 0.59 },
];

export async function POST(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const rateLimited = await enforceRateLimit(req, 'unknown', { context });
  if (rateLimited) return rateLimited;

  const body = await readJsonObject(req, { context });
  if (!body.ok) return body.response;

  const { prompt, model: modelId } = body.data;

  if (!prompt || typeof prompt !== 'string') {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'missing_prompt', status: 400 });
    return finalizeApiResponse(jsonError('Prompt is required', 400, { context }), context);
  }
  if (prompt.length > 500) {
    logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'prompt_too_long', promptLength: prompt.length, status: 400 });
    return finalizeApiResponse(jsonError('Input too long', 400, { context }), context);
  }
  if (detectPromptInjection(prompt)) {
    logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'prompt_injection', promptLength: prompt.length, status: 400 });
    return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
  }

  const model = MODELS.find(m => m.id === modelId);
  if (!model) {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'unknown_model', status: 400 });
    return finalizeApiResponse(jsonError('Model not found', 400, { context }), context);
  }

  const costControl = enforceCostControls({
    route: ROUTE,
    userKey: getClientIp(req, 'unknown'),
    prompt,
    requestedModel: model.id,
    maxTokens: 100,
  });
  if (!costControl.allowed) {
    logApiWarning('api.cost_control_blocked', {
      route: ROUTE,
      traceId: context.traceId,
      reason: costControl.reason,
      estimatedTokens: costControl.estimatedTokens,
      status: 429,
    });
    return finalizeApiResponse(jsonError('AI request limit exceeded. Please shorten the prompt or try again shortly.', 429, { context }), context);
  }
  const effectiveModel = MODELS.find(m => m.id === costControl.fallbackModel) ?? model;

  if (!process.env.GROQ_API_KEY) {
    captureAndLogApiError('api.configuration_error', new Error('Missing GROQ_API_KEY'), { route: ROUTE, traceId: context.traceId, status: 500 });
    return finalizeApiResponse(jsonError('GROQ_API_KEY not configured', 500, { context }), context);
  }

  try {
    const start = Date.now();
    const res = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: effectiveModel.id,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const latency = Date.now() - start;
    const data = await res.json() as {
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      choices?: Array<{ message?: { content?: string } }>;
    };
    if (!res.ok) {
      captureAndLogApiError('api.upstream_error', new Error('Groq API returned non-OK status'), {
        route: ROUTE,
        upstreamStatus: res.status,
        traceId: context.traceId,
        durationMs: Date.now() - context.startedAt,
        status: 500,
      });
      return finalizeApiResponse(jsonError('Failed to call Groq API', 500, { context }), context);
    }

    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const cost = (inputTokens * effectiveModel.inputCost + outputTokens * effectiveModel.outputCost) / 1_000_000;

    const totalDuration = Date.now() - context.startedAt;
    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs: totalDuration,
      upstreamLatencyMs: latency,
      model: effectiveModel.id,
      requestedModel: model.id,
      promptLength: prompt.length,
      inputTokens,
      outputTokens,
    });

    const anomaly = detectAnomaly(totalDuration, 200);
    if (anomaly.anomaly) {
      logAPIEvent({ event: 'api.anomaly_detected', route: ROUTE, traceId: context.traceId, severity: 'warn', durationMs: totalDuration, statusCode: 200, reasons: anomaly.reasons.join('; ') });
    }

    return finalizeApiResponse(NextResponse.json({
      model: effectiveModel.id,
      requestedModel: model.id,
      modelName: effectiveModel.name,
      provider: effectiveModel.provider,
      response: sanitizeLLMOutput(data.choices?.[0]?.message?.content ?? ''),
      latency_ms: latency,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: cost,
    }), context);
  } catch (error) {
    const durationMs = Date.now() - context.startedAt;
    if (error instanceof Error && error.name === 'TimeoutError') {
      logApiWarning('api.upstream_timeout', { route: ROUTE, traceId: context.traceId, status: 504, durationMs });
      return finalizeApiResponse(jsonError('Upstream timeout', 504, { context }), context);
    }
    captureAndLogApiError('api.request_failed', error, { route: ROUTE, traceId: context.traceId, status: 500, durationMs });
    return finalizeApiResponse(jsonError('Failed to call Groq API', 500, { context }), context);
  }
}
