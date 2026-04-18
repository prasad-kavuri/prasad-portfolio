/**
 * Chaos / resilience tests — verify routes degrade gracefully under adverse
 * conditions: upstream timeouts, network drops, partial responses, and
 * concurrent load spikes.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { _resetStore } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

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
let ipSeed = 50_000;
function nextIp(): string {
  return `10.1.${Math.floor(ipSeed / 256) % 256}.${ipSeed++ % 256}`;
}

function llmRequest(body: object, ip = nextIp()) {
  return new Request('http://localhost/api/llm-router', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

function mcpRequest(body: object, ip = nextIp()) {
  return new Request('http://localhost/api/mcp-demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

function paRequest(body: object, ip = nextIp()) {
  return new Request('http://localhost/api/portfolio-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

/** Simulate AbortSignal.timeout() throwing a TimeoutError. */
function makeTimeoutError(): DOMException {
  return Object.assign(new DOMException('The operation was aborted due to timeout', 'TimeoutError'), {
    name: 'TimeoutError',
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
// Suite 1: Upstream timeout handling (504)
// ---------------------------------------------------------------------------
describe('Upstream timeout → 504', () => {
  it('llm-router returns 504 when fetch times out', async () => {
    mockFetch.mockRejectedValue(makeTimeoutError());
    const { POST } = await import('@/app/api/llm-router/route');
    const res = await POST(
      llmRequest({ prompt: 'hello', model: 'llama-3.1-8b-instant' }) as any
    );
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.error).toMatch(/timeout/i);
  });

  it('mcp-demo returns 504 when Groq times out', async () => {
    mockCreate.mockRejectedValue(makeTimeoutError());
    const { POST } = await import('@/app/api/mcp-demo/route');
    const res = await POST(mcpRequest({ query: 'What are your skills?' }) as any);
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.error).toMatch(/timeout/i);
  });

  it('portfolio-assistant returns 504 when Groq times out', async () => {
    mockFetch.mockRejectedValue(makeTimeoutError());
    const { POST } = await import('@/app/api/portfolio-assistant/route');
    const res = await POST(
      paRequest({ messages: [{ role: 'user', content: 'hello' }] }) as any
    );
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.error).toMatch(/timeout/i);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Network drop (fetch throws non-timeout error)
// ---------------------------------------------------------------------------
describe('Network drop → 500 (not 504)', () => {
  it('llm-router returns 500 on generic network error', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const { POST } = await import('@/app/api/llm-router/route');
    const res = await POST(
      llmRequest({ prompt: 'test', model: 'llama-3.1-8b-instant' }) as any
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    // Must not leak internal error details
    expect(body.error).not.toMatch(/TypeError/i);
    expect(body.error).not.toMatch(/Failed to fetch/i);
  });

  it('mcp-demo returns 500 on generic Groq client error', async () => {
    mockCreate.mockRejectedValue(new Error('Connection refused'));
    const { POST } = await import('@/app/api/mcp-demo/route');
    const res = await POST(mcpRequest({ query: 'hello' }) as any);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).not.toMatch(/Connection refused/i);
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Malformed upstream responses
// ---------------------------------------------------------------------------
describe('Malformed upstream responses', () => {
  it('llm-router handles empty choices array gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [], usage: { prompt_tokens: 5, completion_tokens: 0 } }),
    });
    const { POST } = await import('@/app/api/llm-router/route');
    const res = await POST(
      llmRequest({ prompt: 'hello', model: 'llama-3.1-8b-instant' }) as any
    );
    // Should succeed with empty response string rather than throwing
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toBe('');
  });

  it('llm-router handles missing usage field gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'answer' } }],
        // no usage field
      }),
    });
    const { POST } = await import('@/app/api/llm-router/route');
    const res = await POST(
      llmRequest({ prompt: 'hello', model: 'llama-3.1-8b-instant' }) as any
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.input_tokens).toBe(0);
    expect(body.output_tokens).toBe(0);
    expect(body.cost_usd).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 4: Concurrent requests (basic load spike)
// ---------------------------------------------------------------------------
describe('Concurrent load spike', () => {
  it('handles 5 concurrent requests from different IPs without errors', async () => {
    const { POST } = await import('@/app/api/llm-router/route');
    const payload = { prompt: 'concurrent test', model: 'llama-3.1-8b-instant' };

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        POST(llmRequest(payload, nextIp()) as any)
      )
    );

    for (const res of results) {
      // Each should be 200 (rate limit is per-IP, each IP is fresh)
      expect(res.status).not.toBe(500);
    }
  });

  it('rate limiter correctly serializes concurrent requests from same IP', async () => {
    const { POST } = await import('@/app/api/llm-router/route');
    const ip = nextIp();
    const payload = { prompt: 'same-ip concurrent', model: 'llama-3.1-8b-instant' };

    // Fire 12 concurrent requests from the same IP
    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        POST(llmRequest(payload, ip) as any)
      )
    );

    const statuses = results.map(r => r.status);
    const rateLimited = statuses.filter(s => s === 429);
    // At least 2 of 12 should be rate-limited (limit is 10)
    expect(rateLimited.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Suite 5: Observability — anomaly detection integration
// ---------------------------------------------------------------------------
describe('Observability: anomaly detection', () => {
  it('detectAnomaly flags slow responses correctly', async () => {
    const { detectAnomaly } = await import('@/lib/observability');
    const result = detectAnomaly(6000, 200);
    expect(result.anomaly).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/slow_response/);
  });

  it('detectAnomaly flags 5xx status codes', async () => {
    const { detectAnomaly } = await import('@/lib/observability');
    const result = detectAnomaly(100, 500);
    expect(result.anomaly).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/server_error/);
  });

  it('detectAnomaly returns no anomaly for fast 2xx', async () => {
    const { detectAnomaly } = await import('@/lib/observability');
    const result = detectAnomaly(200, 200);
    expect(result.anomaly).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it('startTimer measures elapsed time accurately', async () => {
    const { startTimer } = await import('@/lib/observability');
    const stop = startTimer();
    await new Promise(resolve => setTimeout(resolve, 10));
    const ms = stop();
    expect(ms).toBeGreaterThanOrEqual(5);
    expect(ms).toBeLessThan(500);
  });

  it('logAPIEvent emits structured JSON with required fields', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { logAPIEvent } = await import('@/lib/observability');
    logAPIEvent({
      event: 'api.anomaly_detected',
      route: '/api/test',
      severity: 'warn',
      durationMs: 200,
      statusCode: 200,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(spy.mock.calls[0][0] as string);
    expect(logged).toHaveProperty('timestamp');
    expect(logged).toHaveProperty('event', 'api.anomaly_detected');
    expect(logged).toHaveProperty('route', '/api/test');
    spy.mockRestore();
  });
});
