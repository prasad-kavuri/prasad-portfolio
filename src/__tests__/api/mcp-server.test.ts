import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { _resetStore } from '@/lib/rate-limit';
import { issueToken } from '@/lib/agent-auth';

// Route every client request to the Next.js route handler in-process.
async function routeFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const { POST, GET, DELETE } = await import('@/app/api/mcp/route');
  const request = new NextRequest(new Request(input, init));
  const handler = request.method === 'GET' ? GET : request.method === 'DELETE' ? DELETE : POST;
  return handler(request);
}

async function connect(token?: string) {
  const transport = new StreamableHTTPClientTransport(new URL('http://localhost/api/mcp'), {
    fetch: routeFetch,
    requestInit: token ? { headers: { Authorization: `Bearer ${token}`, 'x-forwarded-for': '5.5.5.5' } } : { headers: { 'x-forwarded-for': '5.5.5.5' } },
  });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(transport);
  return client;
}

const text = (result: unknown) => ((result as { content: { text: string }[] }).content[0].text);

describe('MCP server /api/mcp (official SDK, stateless Streamable HTTP)', () => {
  beforeEach(() => _resetStore());

  it('completes the MCP handshake and lists the profile tools with read-only annotations', async () => {
    const client = await connect();
    expect(client.getServerVersion()?.name).toBe('prasadkavuri-profile');
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(['get_achievements', 'get_experience', 'search_skills']);
    expect(tools.every((t) => t.annotations?.readOnlyHint === true)).toBe(true);
    await client.close();
  });

  it('serves public tools without a credential', async () => {
    const client = await connect();
    const result = await client.callTool({ name: 'get_experience', arguments: { company: 'krutrim' } });
    expect(result.isError).toBe(false);
    expect(JSON.parse(text(result)).company).toBe('Krutrim');
    await client.close();
  });

  it('denies get_achievements without read:profile, and allows it with a credential', async () => {
    const anon = await connect();
    const denied = await anon.callTool({ name: 'get_achievements', arguments: {} });
    expect(denied.isError).toBe(true);
    expect(text(denied)).toMatch(/requires the read:profile scope/);
    await anon.close();

    const token = await issueToken({ sub: 'anon-mcp', type: 'anonymous', scopes: ['read:profile'] }, 600);
    const authed = await connect(token);
    const allowed = await authed.callTool({ name: 'get_achievements', arguments: { company: 'krutrim' } });
    expect(allowed.isError).toBe(false);
    expect(Array.isArray(JSON.parse(text(allowed)))).toBe(true);
    await authed.close();
  });

  it('validates tool input with the declared schema', async () => {
    const client = await connect();
    const result = await client.callTool({ name: 'search_skills', arguments: { category: 'not-a-category' } });
    expect(result.isError).toBe(true);
    await client.close();
  });

  it('rejects an invalid Bearer credential with 401 and resource metadata', async () => {
    const { POST } = await import('@/app/api/mcp/route');
    const res = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: 'Bearer forged.token' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
    }));
    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toMatch(/resource_metadata=/);
  });
});
