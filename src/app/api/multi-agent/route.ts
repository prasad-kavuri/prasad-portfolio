import { NextRequest, NextResponse } from 'next/server';
import { sanitizeLLMOutput } from '@/lib/rate-limit';
import {
  enforceRateLimit,
  jsonError,
  logApiError,
  logApiEvent,
  logApiWarning,
  readJsonObject,
} from '@/lib/api';

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

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]' ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  const parts = host.split('.').map(part => Number(part));
  const isIpv4 = parts.length === 4 && parts.every(part => Number.isInteger(part) && part >= 0 && part <= 255);
  if (!isIpv4) return false;

  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const rateLimited = await enforceRateLimit(req, 'unknown', { route: ROUTE });
  if (rateLimited) return rateLimited;

  const body = await readJsonObject(req, { route: ROUTE });
  if (!body.ok) return body.response;

  const { website_url } = body.data;

  if (!website_url) {
    logApiWarning('api.validation_failed', { route: ROUTE, reason: 'missing_website_url', status: 400 });
    return jsonError('website_url is required', 400);
  }

  if (typeof website_url !== 'string') {
    logApiWarning('api.validation_failed', { route: ROUTE, reason: 'invalid_url_type', status: 400 });
    return jsonError('Invalid input', 400);
  }

  if (website_url.length > 200) {
    logApiWarning('api.abnormal_usage', { route: ROUTE, reason: 'url_too_long', urlLength: website_url.length, status: 400 });
    return jsonError('URL too long', 400);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(website_url);
  } catch {
    logApiWarning('api.validation_failed', { route: ROUTE, reason: 'invalid_url', urlLength: website_url.length, status: 400 });
    return jsonError('Invalid URL', 400);
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    logApiWarning('api.abnormal_usage', { route: ROUTE, reason: 'blocked_protocol', protocol: parsedUrl.protocol, status: 400 });
    return jsonError('Invalid URL', 400);
  }

  if (isBlockedHostname(parsedUrl.hostname)) {
    logApiWarning('api.abnormal_usage', { route: ROUTE, reason: 'blocked_hostname', protocol: parsedUrl.protocol, status: 400 });
    return jsonError('URL not allowed', 400);
  }

  try {
    const response = await fetch(`${HF_SPACE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website_url }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      await response.text().catch(() => '');
      logApiError('api.upstream_error', new Error('Agent backend returned non-OK status'), {
        route: ROUTE,
        upstreamStatus: response.status,
        status: 502,
        durationMs: Date.now() - requestStart,
      });
      return jsonError('Failed to connect to agent backend', 502);
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
    }

    logApiEvent('api.request_completed', {
      route: ROUTE,
      status: 200,
      durationMs: Date.now() - requestStart,
      urlHost: parsedUrl.hostname,
      agentsReturned: Array.isArray(data.agents) ? data.agents.length : 0,
    });

    return NextResponse.json(data);
  } catch (error) {
    logApiError('api.request_failed', error, {
      route: ROUTE,
      status: 502,
      durationMs: Date.now() - requestStart,
    });
    return NextResponse.json(
      { error: 'Failed to connect to agent backend' },
      { status: 502 }
    );
  }
}
