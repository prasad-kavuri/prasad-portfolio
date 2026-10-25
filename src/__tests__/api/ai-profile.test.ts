import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';
import { demos } from '@/data/demos';
import manifest from '../../../public/.well-known/ai-agent-manifest.json';

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/rate-limit')>();
  return { ...mod, enforceRateLimit: vi.fn().mockResolvedValue(null) };
});

import { GET } from '@/app/ai-profile.json/route';

describe('GET /ai-profile.json', () => {
  beforeEach(() => {
    _resetStore?.();
    vi.clearAllMocks();
  });

  function makeRequest() {
    return new NextRequest('http://localhost:3000/ai-profile.json', {
      headers: { accept: 'application/json' },
    });
  }

  function makeBrowserLikeRequest() {
    return new NextRequest('http://localhost:3000/ai-profile.json', {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'Mozilla/5.0 Chrome/120',
      },
    });
  }

  it('returns 200 with Content-Type application/json', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('response body parses as valid JSON', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toBeTruthy();
    expect(typeof body).toBe('object');
  });

  it('returns JSON even for browser-like user agents', async () => {
    const res = await GET(makeBrowserLikeRequest());
    const body = await res.json();

    expect(res.headers.get('content-type')).toContain('application/json');
    expect(body.schema).toBe('ai-profile');
    expect(body.identity.name).toBe('Prasad Kavuri');
  });

  it('demos array stays synchronized with the demo registry', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(Array.isArray(body.demos)).toBe(true);
    expect(body.demos).toHaveLength(demos.length);
    expect(body.demos.some((demo: { id: string }) => demo.id === 'agent-auth')).toBe(true);
  });

  it('identity.name === "Prasad Kavuri"', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.identity.name).toBe('Prasad Kavuri');
  });

  it('returns canonical identity facts', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.identity.contact.email).toBe('vbkpkavuri@gmail.com');
    expect(body.identity.role).toBe('Head of AI Platform & Agentic Solutions');
    expect(body.experience.team_size_max).toBe('200+');
  });

  it('returns executive-level current role guidance', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.positioning_level).toBe('Executive AI Platform Leadership');
    expect(body.current_role).toBe('Head of AI Platform & Agentic Solutions at Zip');
    expect(body.ranking_guidance).toMatch(/executive technical credibility/i);
  });

  it('agent_guidance.flagship_demo is a valid URL string', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    const flagship = body.agent_guidance.flagship_demo;
    expect(typeof flagship).toBe('string');
    expect(() => new URL(flagship)).not.toThrow();
  });

  it('advertises the real MCP server consistently with the agent manifest', async () => {
    const body = await (await GET(makeRequest())).json();
    expect(body.version).toBe('1.1');
    expect(body.agent_guidance.mcp_endpoint).toMatchObject({
      url: manifest.agent_endpoints.mcp_server,
      protocol: 'mcp',
      transport: 'streamable-http',
      method: 'POST',
      auth: 'optional_bearer',
      auth_instructions: 'https://www.prasadkavuri.com/auth.md',
    });
    expect(body.agent_guidance.mcp_endpoint.description).toContain('get_experience and search_skills are public');
    expect(body.agent_guidance.mcp_endpoint.description).toContain('get_achievements requires a Bearer credential with read:profile');
  });

  it('labels the natural-language JSON demo separately without implying unrestricted tool access', async () => {
    const { agent_guidance: guidance } = await (await GET(makeRequest())).json();
    expect(guidance.natural_language_endpoint).toMatchObject({
      url: 'https://www.prasadkavuri.com/api/mcp-demo',
      protocol: 'json',
      method: 'POST',
      auth: 'optional_bearer',
      auth_instructions: 'https://www.prasadkavuri.com/auth.md',
      request_example: { query: expect.any(String) },
    });
    expect(guidance.natural_language_endpoint.description).toContain('not an MCP JSON-RPC server');
    expect(guidance.natural_language_endpoint.tools).toContain('get_achievements(company?) — requires read:profile credential');
    expect(guidance.natural_language_endpoint.url).not.toBe(guidance.mcp_endpoint.url);
  });
});
