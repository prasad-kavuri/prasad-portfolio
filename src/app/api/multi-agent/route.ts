import { NextRequest, NextResponse } from 'next/server';
import { checkOutput, sanitizeLLMOutput, validateAgentHandoff } from '@/lib/guardrails';
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
import { trackModelOutput } from '@/lib/drift-monitor';
import { isBlockedOutboundUrl } from '@/lib/url-security';
import { assertSafeFetchTarget, safeServerFetch } from '@/lib/safe-fetch';

const HF_SPACE_URL = 'https://prasadkavuri-multi-agent-demo.hf.space';
const ROUTE = '/api/multi-agent';

interface AgentResult {
  findings?: unknown;
  recommendation?: unknown;
  [key: string]: unknown;
}

interface AgentBackendResponse {
  agents?: unknown;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const rateLimited = await enforceRateLimit(req, 'unknown', { context });
  if (rateLimited) return rateLimited;

  const body = await readJsonObject(req, { context });
  if (!body.ok) return body.response;

  const { website_url, approvalState } = body.data;

  if (!website_url) {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'missing_website_url', status: 400 });
    return finalizeApiResponse(jsonError('website_url is required', 400, { context }), context);
  }

  if (approvalState !== undefined && approvalState !== 'pending' && approvalState !== 'approved') {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_approval_state', status: 400 });
    return finalizeApiResponse(jsonError('Invalid approval state', 400, { context }), context);
  }

  if (typeof website_url !== 'string') {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_url_type', status: 400 });
    return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
  }

  if (website_url.length > 200) {
    logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'url_too_long', urlLength: website_url.length, status: 400 });
    return finalizeApiResponse(jsonError('URL too long', 400, { context }), context);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(website_url);
  } catch {
    logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_url', urlLength: website_url.length, status: 400 });
    return finalizeApiResponse(jsonError('Invalid URL', 400, { context }), context);
  }

  const urlSafety = isBlockedOutboundUrl(parsedUrl);
  if (urlSafety.blocked) {
    logApiWarning('api.abnormal_usage', {
      route: ROUTE,
      traceId: context.traceId,
      reason: urlSafety.reason ?? 'blocked_outbound_url',
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      status: 400,
    });
    return finalizeApiResponse(jsonError('URL not allowed', 400, { context }), context);
  }

  try {
    await assertSafeFetchTarget(parsedUrl);
  } catch (error) {
    logApiWarning('api.abnormal_usage', {
      route: ROUTE,
      traceId: context.traceId,
      reason: error instanceof Error ? error.message : 'unsafe_outbound_url',
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      status: 400,
    });
    return finalizeApiResponse(jsonError('URL not allowed', 400, { context }), context);
  }

  try {
    const response = await safeServerFetch(`${HF_SPACE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website_url }),
      signal: AbortSignal.timeout(60000),
    }, { maxRedirects: 1 });

    if (!response.ok) {
      await response.text().catch(() => '');
      trackModelOutput(ROUTE, `upstream_error:${response.status}`, 'error');
      captureAndLogApiError('api.upstream_error', new Error('Agent backend returned non-OK status'), {
        route: ROUTE,
        traceId: context.traceId,
        upstreamStatus: response.status,
        status: 502,
        durationMs: Date.now() - context.startedAt,
      });
      return finalizeApiResponse(jsonError('Failed to connect to agent backend', 502, { context }), context);
    }

    const data = (await response.json()) as AgentBackendResponse;

    // Sanitize LLM-generated string fields from the agent backend
    if (data?.agents && Array.isArray(data.agents)) {
      data.agents = data.agents.map((agent: AgentResult) => ({
        ...agent,
        findings: Array.isArray(agent.findings)
          ? agent.findings.map((f: string) => sanitizeLLMOutput(f))
          : agent.findings,
        recommendation: typeof agent.recommendation === 'string'
          ? sanitizeLLMOutput(agent.recommendation)
          : agent.recommendation,
      }));

      // Agent-to-agent trust boundary validation
      const agentNames = ['Analyzer', 'Researcher', 'Strategist'];
      for (let i = 0; i < agentNames.length - 1; i++) {
        const fromName = agentNames[i];
        const toName = agentNames[i + 1];
        const fromAgent = (data.agents as AgentResult[]).find(
          (a) => typeof a.name === 'string' && a.name.toLowerCase().includes(fromName.toLowerCase())
        );
        if (fromAgent) {
          const output = [
            ...(Array.isArray(fromAgent.findings) ? fromAgent.findings : []),
            typeof fromAgent.recommendation === 'string' ? fromAgent.recommendation : '',
          ].join(' ');
          const handoffResult = validateAgentHandoff(fromName, toName, output);
          if (!handoffResult.isSafe) {
            logApiWarning('api.agent_handoff_unsafe', {
              route: ROUTE,
              traceId: context.traceId,
              fromAgent: fromName,
              toAgent: toName,
              issues: handoffResult.issues.join(','),
              score: handoffResult.score,
              status: 200,
            });
          }
        }
      }
    }

    // Output guardrail check on the full agent response
    const fullOutput = JSON.stringify(data);
    const guardResult = checkOutput(fullOutput, context.traceId);
    if (!guardResult.isSafe) {
      logApiWarning('api.guardrail_output_triggered', {
        route: ROUTE,
        traceId: context.traceId,
        issues: guardResult.issues.join(','),
        score: guardResult.score,
        status: 200,
      });
    }

    trackModelOutput(ROUTE, fullOutput, 'success');

    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs: Date.now() - context.startedAt,
      urlHost: parsedUrl.hostname,
      agentsReturned: Array.isArray(data.agents) ? data.agents.length : 0,
    });

    return finalizeApiResponse(NextResponse.json(data), context);
  } catch (error) {
    trackModelOutput(ROUTE, error instanceof Error ? error.name : 'agent_backend_error', 'error');
    captureAndLogApiError('api.request_failed', error, {
      route: ROUTE,
      traceId: context.traceId,
      status: 502,
      durationMs: Date.now() - context.startedAt,
    });
    return finalizeApiResponse(jsonError('Failed to connect to agent backend', 502, { context }), context);
  }
}
