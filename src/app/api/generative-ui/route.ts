import { NextRequest, NextResponse } from 'next/server';
import profile from '@/data/profile.json';
import { detectPromptInjection, sanitizeLLMOutput } from '@/lib/guardrails';
import {
  CATALOG_PROMPT_DESCRIPTION,
  isUiSpec,
  type UiNode,
  type UiSpec,
} from '@/lib/generativeUiCatalog';
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
} from '@/lib/api';

const ROUTE = '/api/generative-ui';
const MAX_QUERY_LENGTH = 300;
const ALLOWED_QUERY_INPUT = /^[\p{L}\p{N}\s.,;:!?'"()/$%+\-#&@]+$/u;

function sanitizeText(input: string): string {
  return sanitizeLLMOutput(input).trim();
}

function sanitizeNode(node: UiNode): UiNode {
  switch (node.type) {
    case 'stat-tile':
      return {
        ...node,
        label: sanitizeText(node.label),
        value: sanitizeText(node.value),
        caption: node.caption ? sanitizeText(node.caption) : undefined,
      };
    case 'comparison-table':
      return {
        ...node,
        title: sanitizeText(node.title),
        leftHeader: sanitizeText(node.leftHeader),
        rightHeader: sanitizeText(node.rightHeader),
        rows: node.rows.map((row) => ({
          label: sanitizeText(row.label),
          left: sanitizeText(row.left),
          right: sanitizeText(row.right),
        })),
      };
    case 'timeline':
      return {
        ...node,
        title: sanitizeText(node.title),
        entries: node.entries.map((entry) => ({
          period: sanitizeText(entry.period),
          title: sanitizeText(entry.title),
          detail: sanitizeText(entry.detail),
        })),
      };
    case 'skill-list':
      return {
        ...node,
        title: sanitizeText(node.title),
        skills: node.skills.map(sanitizeText),
      };
  }
}

function sanitizeUiSpec(spec: UiSpec): UiSpec {
  return {
    summary: sanitizeText(spec.summary),
    nodes: spec.nodes.map(sanitizeNode),
  };
}

export async function POST(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  try {
    const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
    if (rateLimited) return rateLimited;

    const body = await readJsonObject(req, { context });
    if (!body.ok) return body.response;

    const { query } = body.data;

    if (!query || typeof query !== 'string' || !query.trim()) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'missing_query', status: 400 });
      return finalizeApiResponse(jsonError('Query is required', 400, { context }), context);
    }

    if (query.length > MAX_QUERY_LENGTH) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'query_too_long', queryLength: query.length, status: 400 });
      return finalizeApiResponse(jsonError('Input too long', 400, { context }), context);
    }

    const injectionIssues = detectPromptInjection(query);
    const hasNonTemplateInjection = injectionIssues.some((issue) => issue !== 'template_injection');
    if (hasNonTemplateInjection) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'prompt_injection', status: 400 });
      return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
    }

    const safeQuery = query.trim();
    if (!ALLOWED_QUERY_INPUT.test(safeQuery)) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'disallowed_characters', status: 400 });
      return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
    }

    const overBudget = await enforceDailyBudget(context);
    if (overBudget) return overBudget;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      captureAndLogApiError('api.configuration_error', new Error('Missing GROQ_API_KEY'), { route: ROUTE, traceId: context.traceId, status: 500 });
      return finalizeApiResponse(jsonError('GROQ_API_KEY not configured', 500, { context }), context);
    }

    const topExperience = profile.experience
      .slice(0, 4)
      .map((exp) => `${exp.company} — ${exp.title} (${exp.period}): ${exp.highlights.join(' ')}`)
      .join('\n');
    const skillGroups = Object.entries(profile.skills as Record<string, string[]>)
      .map(([group, items]) => `${group}: ${items.join(', ')}`)
      .join('\n');

    const systemPrompt = `You are a constrained UI generator for Prasad Kavuri's portfolio site. You never write prose answers directly to the user — you only produce structured UI specs, described below.

PROFILE DATA (ground every value in this — do not invent facts):
${topExperience}

Skills:
${skillGroups}

${CATALOG_PROMPT_DESCRIPTION}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: safeQuery },
        ],
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      await response.text().catch(() => '');
      captureAndLogApiError('api.upstream_error', new Error('Groq API returned non-OK status'), {
        route: ROUTE,
        traceId: context.traceId,
        upstreamStatus: response.status,
        status: 500,
        durationMs: Date.now() - context.startedAt,
      });
      return finalizeApiResponse(jsonError('Failed to generate UI spec from Groq API', 500, { context }), context);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    let parsedSpec: unknown;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      parsedSpec = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      captureAndLogApiError('api.llm_parse_error', parseError, {
        route: ROUTE,
        traceId: context.traceId,
        status: 500,
        durationMs: Date.now() - context.startedAt,
        responseLength: content.length,
      });
      return finalizeApiResponse(jsonError('Failed to generate a valid UI spec. Please try again.', 500, { context }), context);
    }

    // The catalog-validation step: anything that doesn't match the fixed
    // component shapes is rejected here, before it ever reaches the client.
    if (!isUiSpec(parsedSpec)) {
      logApiWarning('api.llm_schema_error', {
        route: ROUTE,
        traceId: context.traceId,
        reason: 'ui_spec_failed_catalog_validation',
        status: 422,
      });
      return finalizeApiResponse(jsonError('Model output did not match the allowed UI catalog', 422, { context }), context);
    }

    const sanitized = sanitizeUiSpec(parsedSpec);

    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs: Date.now() - context.startedAt,
      queryLength: safeQuery.length,
      nodeCount: sanitized.nodes.length,
    });

    return finalizeApiResponse(NextResponse.json(sanitized), context);
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
