import { NextRequest, NextResponse } from 'next/server';
import { sanitizeLLMOutput } from '@/lib/rate-limit';
import { enforceRateLimit, jsonError, readJsonObject } from '@/lib/api';

const HF_SPACE_URL = 'https://prasadkavuri-multi-agent-demo.hf.space';

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
  const rateLimited = await enforceRateLimit(req, 'unknown');
  if (rateLimited) return rateLimited;

  const body = await readJsonObject(req);
  if (!body.ok) return body.response;

  const { website_url } = body.data;

  if (!website_url) {
    return jsonError('website_url is required', 400);
  }

  if (typeof website_url !== 'string') {
    return jsonError('Invalid input', 400);
  }

  if (website_url.length > 200) {
    return jsonError('URL too long', 400);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(website_url);
  } catch {
    return jsonError('Invalid URL', 400);
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return jsonError('Invalid URL', 400);
  }

  if (isBlockedHostname(parsedUrl.hostname)) {
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

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to connect to agent backend' },
      { status: 502 }
    );
  }
}
