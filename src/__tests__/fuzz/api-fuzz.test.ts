/**
 * FUZZ TEST SUITE
 * Tests extreme/malformed inputs against all API routes.
 * Run with: npm run test:fuzz
 * These must pass before every production deployment.
 *
 * Categories tested per route:
 *   A — Oversized payloads (10K+ strings, huge arrays, deep nesting)
 *   B — Type confusion (null, number, boolean, array where object expected)
 *   C — String abuse (null bytes, unicode, CRLF, SQL injection, path traversal)
 *   D — Structural attacks (empty body, missing required keys)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('@/data/profile.json', () => ({
  default: {
    knowledgeBase: ['Prasad Kavuri is Head of AI Engineering.'],
    experience: [
      {
        company: 'Krutrim',
        title: 'Head of AI Engineering',
        period: '2025–Present',
        highlights: ['Built agentic AI platform'],
      },
    ],
  },
}));

vi.mock('groq-sdk', () => {
  class MockGroq {
    chat = {
      completions: {
        create: () => Promise.reject(new Error('Groq API not available in tests')),
      },
    };
    constructor() {}
  }
  return { Groq: MockGroq };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** IP counter so each test gets a unique IP and avoids rate-limit collisions. */
let ipCounter = 1;
function nextIp() {
  return `10.99.${Math.floor(ipCounter / 255)}.${ipCounter++ % 255 || 1}`;
}

function makePostRequest(path: string, body: unknown, ip?: string): NextRequest {
  let bodyStr: string;
  try {
    bodyStr = JSON.stringify(body);
  } catch {
    bodyStr = '{}';
  }
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip ?? nextIp(),
    },
    body: bodyStr,
  });
}

function makeGetRequest(path: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'GET',
    headers,
  });
}

/**
 * Core fuzz assertion contract:
 *   - Status must be in expectedStatuses
 *   - Response time < 5 000 ms (no hanging)
 *   - Body must be valid JSON (no crash dumps)
 *   - No internal paths or stack-trace frames in the response body
 */
async function assertSafeResponse(
  res: Response,
  start: number,
  expectedStatuses: number[]
) {
  const elapsed = Date.now() - start;
  const text = await res.text();

  expect(
    expectedStatuses,
    `Status ${res.status} not in [${expectedStatuses}]. Body: ${text.slice(0, 300)}`
  ).toContain(res.status);

  expect(elapsed, 'Response took > 5 000 ms — possible hanging').toBeLessThan(5_000);

  // No stack traces or internal file paths
  expect(text).not.toMatch(/at Object\.|\.ts:\d+|\.js:\d+|at async /);
  expect(text).not.toMatch(/node_modules\//);

  if (text.trim()) {
    expect(() => JSON.parse(text), `Body is not valid JSON: ${text.slice(0, 200)}`).not.toThrow();
  }
}

/** Build a deterministic deeply-nested object (200 levels). */
function deeplyNested(depth = 200): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  let cur = root;
  for (let i = 0; i < depth; i++) {
    cur['child'] = {};
    cur = cur['child'] as Record<string, unknown>;
  }
  cur['leaf'] = 'value';
  return root;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _resetStore();
  vi.clearAllMocks();
  // Default: fetch returns 401 so any route that reaches the external API
  // fails gracefully (500) rather than hanging.
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  );
  // Each suite starts GROQ key unset; set per-test where needed
  delete process.env.GROQ_API_KEY;
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/portfolio-assistant
// Body: { messages: [{role, content}][], useRAG?: boolean }
// ─────────────────────────────────────────────────────────────────────────────
describe('Fuzz: /api/portfolio-assistant', () => {
  async function post(body: unknown, statuses = [400, 429]) {
    const { POST } = await import('@/app/api/portfolio-assistant/route');
    const start = Date.now();
    const res = await POST(makePostRequest('/api/portfolio-assistant', body));
    await assertSafeResponse(res, start, statuses);
    return res;
  }

  it('[A] 10 K-character message content is rejected as too long', async () => {
    await post({ messages: [{ role: 'user', content: 'A'.repeat(10_000) }], useRAG: false });
  });

  it('[B] null messages field is rejected', async () => {
    await post({ messages: null, useRAG: false });
  });

  it('[B] null content inside a message is rejected (type confusion)', async () => {
    await post({ messages: [{ role: 'user', content: null }], useRAG: false });
  });

  it('[B] array of nulls as messages is rejected', async () => {
    await post({ messages: [null, null], useRAG: false });
  });

  it('[C] null bytes in message content do not crash the server', async () => {
    await post(
      { messages: [{ role: 'user', content: '\x00\x01\x02\xFF'.repeat(5) }], useRAG: false },
      [400, 429, 500] // passes validation length-wise; may reach API key check
    );
  });

  it('[C] RTL override character in message content does not crash', async () => {
    await post(
      { messages: [{ role: 'user', content: '\u202Ereversed text\u202C' }], useRAG: false },
      [400, 429, 500]
    );
  });

  it('[D] deeply nested object with no messages key is rejected', async () => {
    await post(deeplyNested());
  });

  it('[D] empty body {} is rejected (messages missing)', async () => {
    await post({});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/resume-generator
// Body: { jobDescription: string, focusAreas: string[] }
// ─────────────────────────────────────────────────────────────────────────────
describe('Fuzz: /api/resume-generator', () => {
  async function post(body: unknown, statuses = [400, 429]) {
    const { POST } = await import('@/app/api/resume-generator/route');
    const start = Date.now();
    const res = await POST(makePostRequest('/api/resume-generator', body));
    await assertSafeResponse(res, start, statuses);
    return res;
  }

  it('[A] 10 K-character jobDescription is rejected as too long', async () => {
    await post({ jobDescription: 'j'.repeat(10_000), focusAreas: [] });
  });

  it('[A] 1 000-item focusAreas array does not crash', async () => {
    // Valid jobDescription but extreme focusAreas array — reaches API key → 500
    await post(
      { jobDescription: 'VP of AI role', focusAreas: Array(1_000).fill('skill') },
      [400, 429, 500]
    );
  });

  it('[B] null jobDescription is rejected', async () => {
    await post({ jobDescription: null, focusAreas: [] });
  });

  it('[B] number jobDescription (type confusion) is rejected', async () => {
    await post({ jobDescription: 42, focusAreas: [] });
  });

  it('[B] boolean jobDescription is rejected', async () => {
    await post({ jobDescription: true, focusAreas: [] });
  });

  it('[B] null focusAreas (type confusion) is rejected', async () => {
    await post({ jobDescription: 'VP of AI role', focusAreas: null });
  });

  it('[C] SQL injection in jobDescription does not crash', async () => {
    await post(
      { jobDescription: "'; DROP TABLE users; --", focusAreas: [] },
      [400, 429, 500]
    );
  });

  it('[C] CRLF injection in jobDescription does not crash', async () => {
    await post(
      { jobDescription: 'AI role\r\nX-Injected: evil', focusAreas: [] },
      [400, 429, 500]
    );
  });

  it('[C] path traversal attempt in jobDescription does not crash', async () => {
    await post(
      { jobDescription: '../../../../etc/passwd', focusAreas: [] },
      [400, 429, 500]
    );
  });

  it('[D] empty body {} is rejected', async () => {
    await post({});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/llm-router
// Body: { prompt: string, model: string }
// ─────────────────────────────────────────────────────────────────────────────
describe('Fuzz: /api/llm-router', () => {
  async function post(body: unknown, statuses = [400, 429]) {
    const { POST } = await import('@/app/api/llm-router/route');
    const start = Date.now();
    const res = await POST(makePostRequest('/api/llm-router', body));
    await assertSafeResponse(res, start, statuses);
    return res;
  }

  it('[A] 10 K-character prompt is rejected as too long', async () => {
    await post({ prompt: 'A'.repeat(10_000), model: 'llama-3.1-8b-instant' });
  });

  it('[B] null prompt is rejected', async () => {
    await post({ prompt: null, model: 'llama-3.1-8b-instant' });
  });

  it('[B] boolean prompt (type confusion) is rejected', async () => {
    await post({ prompt: true, model: 'llama-3.1-8b-instant' });
  });

  it('[B] number prompt (type confusion) is rejected', async () => {
    await post({ prompt: 9999, model: 'llama-3.1-8b-instant' });
  });

  it('[B] unknown model string is rejected', async () => {
    await post({ prompt: 'hello', model: 'gpt-99-turbo' });
  });

  it('[B] null model falls back to model-not-found rejection', async () => {
    await post({ prompt: 'hello', model: null });
  });

  it('[C] SQL injection string in prompt does not crash', async () => {
    await post(
      { prompt: "'; DROP TABLE llms; --", model: 'llama-3.1-8b-instant' },
      [400, 429, 500]
    );
  });

  it('[C] 4-byte UTF-8 characters in prompt do not crash', async () => {
    await post(
      { prompt: '𠜎𠜱𠝹𠱓'.repeat(20), model: 'llama-3.1-8b-instant' },
      [400, 429, 500]
    );
  });

  it('[D] empty body {} is rejected', async () => {
    await post({});
  });

  it('[D] deeply nested object as prompt field is rejected (type confusion)', async () => {
    await post({ prompt: deeplyNested(), model: 'llama-3.1-8b-instant' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/mcp-demo
// Body: { query: string }
// ─────────────────────────────────────────────────────────────────────────────
describe('Fuzz: /api/mcp-demo', () => {
  async function post(body: unknown, statuses = [400, 429]) {
    const { POST } = await import('@/app/api/mcp-demo/route');
    const start = Date.now();
    const res = await POST(makePostRequest('/api/mcp-demo', body));
    await assertSafeResponse(res, start, statuses);
    return res;
  }

  it('[A] 10 K-character query is rejected as too long', async () => {
    await post({ query: 'A'.repeat(10_000) });
  });

  it('[B] null query is rejected', async () => {
    await post({ query: null });
  });

  it('[B] number query (type confusion) is rejected', async () => {
    await post({ query: 42 });
  });

  it('[B] array query (type confusion) is rejected', async () => {
    await post({ query: ['what', 'is', 'your', 'name'] });
  });

  it('[C] null bytes in query do not crash', async () => {
    await post({ query: 'hello\x00world' }, [400, 429, 500]);
  });

  it('[C] 4-byte UTF-8 in query does not crash', async () => {
    await post({ query: '𠜎𠜱𠝹𠱓 experience' }, [400, 429, 500]);
  });

  it('[C] CRLF injection in query does not crash', async () => {
    await post({ query: 'experience\r\nX-Injected: evil' }, [400, 429, 500]);
  });

  it('[D] empty body {} is rejected', async () => {
    await post({});
  });

  it('[D] deeply nested object with no query key is rejected', async () => {
    await post(deeplyNested());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/multi-agent
// Body: { website_url: string }
// ─────────────────────────────────────────────────────────────────────────────
describe('Fuzz: /api/multi-agent', () => {
  async function post(body: unknown, statuses = [400, 429]) {
    const { POST } = await import('@/app/api/multi-agent/route');
    const start = Date.now();
    const res = await POST(makePostRequest('/api/multi-agent', body));
    await assertSafeResponse(res, start, statuses);
    return res;
  }

  it('[A] 10 K-character website_url is rejected as too long', async () => {
    await post({ website_url: 'https://example.com/' + 'A'.repeat(10_000) });
  });

  it('[B] null website_url is rejected', async () => {
    await post({ website_url: null });
  });

  it('[B] number website_url (type confusion) is rejected with safe error', async () => {
    // new URL(number) throws; caught → 400
    await post({ website_url: 12345 });
  });

  it('[B] array website_url (type confusion) is rejected', async () => {
    await post({ website_url: ['https://example.com'] });
  });

  it('[C] javascript: scheme URL is rejected', async () => {
    await post({ website_url: 'javascript:alert(1)' });
  });

  it('[C] path traversal in URL is rejected (invalid URL format)', async () => {
    await post({ website_url: '../../../../etc/passwd' });
  });

  it('[C] SSRF attempt to internal address is blocked', async () => {
    await post({ website_url: 'http://127.0.0.1/admin' });
  });

  it('[C] SSRF attempt to metadata service is blocked', async () => {
    await post({ website_url: 'http://169.254.169.254/latest/meta-data/' });
  });

  it('[C] SSRF attempt with decimal-encoded loopback is blocked', async () => {
    await post({ website_url: 'http://2130706433/admin' });
  });

  it('[C] SSRF attempt with IPv6 loopback is blocked', async () => {
    await post({ website_url: 'http://[::1]/admin' });
  });

  it('[D] empty body {} is rejected', async () => {
    await post({});
  });

  it('[D] deeply nested object with no website_url key is rejected', async () => {
    await post(deeplyNested());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/resume-download
// Method: GET — no request body; fuzz via headers
// ─────────────────────────────────────────────────────────────────────────────
describe('Fuzz: /api/resume-download', () => {
  async function get(headers: Record<string, string> = {}) {
    const { GET } = await import('@/app/api/resume-download/route');
    const start = Date.now();
    const req = makeGetRequest('/api/resume-download', headers);
    const res = await GET(req);
    const elapsed = Date.now() - start;
    const text = await res.text();

    // Redirect (302/307) or success; must not crash with 500
    expect([200, 301, 302, 307, 308]).toContain(res.status);
    expect(elapsed).toBeLessThan(5_000);
    expect(text).not.toMatch(/at Object\.|\.ts:\d+|\.js:\d+/);
    return res;
  }

  it('[C] oversized Referer header does not crash', async () => {
    await get({ referer: 'https://evil.com/' + 'X'.repeat(10_000) });
  });

  it('[C] CRLF injection in Referer header does not crash', async () => {
    await get({ referer: 'https://example.com\r\nX-Injected: evil' });
  });
});
