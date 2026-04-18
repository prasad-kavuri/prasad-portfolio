/**
 * Stateful sequence tests — verify behaviour that depends on cross-request state
 * (rate limit counters, multi-step LLM tool-call loops, retry logic).
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { _resetStore } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// Global fetch mock (used by llm-router)
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// groq-sdk mock (used by mcp-demo)
// vi.mock is hoisted so mockCreate must be declared with vi.hoisted().
// ---------------------------------------------------------------------------
const mockCreate = vi.hoisted(() => vi.fn());
vi.mock('groq-sdk', () => {
  class MockGroq {
    chat = { completions: { create: mockCreate } };
    constructor() {}
  }
  return { Groq: MockGroq };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let ipCounter = 10_000;
function nextIp(): string {
  return `10.0.${Math.floor(ipCounter / 256) % 256}.${ipCounter++ % 256}`;
}

function llmRequest(body: object, ip: string) {
  return new Request('http://localhost/api/llm-router', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

function mcpRequest(body: object, ip: string) {
  return new Request('http://localhost/api/mcp-demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

const OK_FETCH = {
  ok: true,
  status: 200,
  json: async () => ({
    choices: [{ message: { content: 'ok' } }],
    usage: { prompt_tokens: 10, completion_tokens: 5 },
  }),
};

beforeEach(() => {
  _resetStore();
  vi.clearAllMocks();
  process.env.GROQ_API_KEY = 'test-key';
  mockFetch.mockResolvedValue(OK_FETCH);
});

afterEach(() => {
  delete process.env.GROQ_API_KEY;
});

// ---------------------------------------------------------------------------
// Suite 1: Rate-limit drain and enforcement
// ---------------------------------------------------------------------------
describe('Rate-limit enforcement sequence', () => {
  it('allows first 10 requests then blocks subsequent ones with 429', async () => {
    const { POST } = await import('@/app/api/llm-router/route');
    const ip = nextIp();
    const payload = { prompt: 'hello', model: 'llama-3.1-8b-instant' };

    // First 10 requests must NOT return 429
    for (let i = 0; i < 10; i++) {
      const res = await POST(llmRequest(payload, ip) as any);
      expect(res.status, `request ${i + 1} should not be rate-limited`).not.toBe(429);
    }

    // Requests 11-15 must be 429
    for (let i = 0; i < 5; i++) {
      const res = await POST(llmRequest(payload, ip) as any);
      expect(res.status, `request ${i + 11} should be rate-limited`).toBe(429);
      const body = await res.json();
      expect(body.error).toMatch(/too many requests/i);
    }
  });

  it('rate limit is per-IP: a different IP is not affected', async () => {
    const { POST } = await import('@/app/api/llm-router/route');
    const exhaustedIp = nextIp();
    const freshIp = nextIp();
    const payload = { prompt: 'hello', model: 'llama-3.1-8b-instant' };

    // Exhaust the first IP
    for (let i = 0; i < 11; i++) {
      await POST(llmRequest(payload, exhaustedIp) as any);
    }

    // Fresh IP should still succeed (non-429)
    const res = await POST(llmRequest(payload, freshIp) as any);
    expect(res.status).not.toBe(429);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: MCP-demo two-step tool-call sequence
// ---------------------------------------------------------------------------
describe('MCP-demo tool-call sequencing', () => {
  it('calls Groq twice: once for tool selection, once for final answer', async () => {
    const ip = nextIp();

    const toolCallResponse = {
      choices: [{
        message: {
          content: null,
          tool_calls: [{
            id: 'call_1',
            function: { name: 'search_skills', arguments: JSON.stringify({ category: 'ai_ml' }) },
          }],
        },
      }],
    };

    const finalResponse = {
      choices: [{ message: { content: 'Prasad has strong AI/ML skills.' } }],
    };

    mockCreate
      .mockResolvedValueOnce(toolCallResponse)  // Step 1: tool selection
      .mockResolvedValueOnce(finalResponse);     // Step 2: final answer

    const { POST } = await import('@/app/api/mcp-demo/route');
    const res = await POST(mcpRequest({ query: 'What are Prasad skills?' }, ip) as any);

    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledTimes(2);

    const body = await res.json();
    expect(body.toolCallLog).toHaveLength(1);
    expect(body.toolCallLog[0].tool).toBe('search_skills');
    expect(body.finalAnswer).toBe('Prasad has strong AI/ML skills.');
  });

  it('returns a direct answer when Groq returns no tool calls', async () => {
    const ip = nextIp();

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Direct answer.', tool_calls: [] } }],
    });

    const { POST } = await import('@/app/api/mcp-demo/route');
    const res = await POST(mcpRequest({ query: 'hello' }, ip) as any);

    expect(res.status).toBe(200);
    // Only one Groq call — no tool execution loop
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body.finalAnswer).toBe('Direct answer.');
    expect(body.toolCallLog).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 3: LLM-router retry / fallback
// ---------------------------------------------------------------------------
describe('LLM-router retry on transient upstream error', () => {
  it('succeeds on second attempt when first fetch returns 500', async () => {
    const ip = nextIp();

    // First fetch returns 500, second succeeds
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'internal' }),
      })
      .mockResolvedValueOnce(OK_FETCH);

    const { POST } = await import('@/app/api/llm-router/route');
    const res = await POST(
      llmRequest({ prompt: 'retry test', model: 'llama-3.1-8b-instant' }, ip) as any
    );

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns 500 when all retry attempts fail', async () => {
    const ip = nextIp();

    // Both attempts fail with 500
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'internal' }),
    });

    const { POST } = await import('@/app/api/llm-router/route');
    const res = await POST(
      llmRequest({ prompt: 'retry exhaust', model: 'llama-3.1-8b-instant' }, ip) as any
    );

    expect(res.status).toBe(500);
    // MAX_RETRIES=1 → 2 total attempts
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const body = await res.json();
    expect(body.error).toMatch(/groq api/i);
  });

  it('does not retry on 4xx client errors', async () => {
    const ip = nextIp();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'unauthorized' }),
    });

    const { POST } = await import('@/app/api/llm-router/route');
    const res = await POST(
      llmRequest({ prompt: 'no retry on 4xx', model: 'llama-3.1-8b-instant' }, ip) as any
    );

    // 4xx → no retry, just 500 from the route
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
  });
});
