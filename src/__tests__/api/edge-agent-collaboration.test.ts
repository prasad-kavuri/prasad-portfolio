import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { _resetStore } from '@/lib/rate-limit';

// --- Mocks (hoisted before imports by Vitest) ---

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

vi.mock('@/lib/transformers-loader', () => ({
  loadTransformersModule: vi.fn().mockResolvedValue({
    pipeline: vi.fn().mockResolvedValue(
      vi.fn().mockResolvedValue([]) // default: empty NER entities
    ),
  }),
}));

vi.mock('groq-sdk', () => {
  function MockGroq() {
    return {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'The customer requests an upgrade to Enterprise tier.' } }],
          }),
        },
      },
    };
  }
  return { Groq: MockGroq };
});

// Static import of page component — mocks are hoisted so this gets the mocked dependencies.
import EdgeAgentCollaborationPage from '@/app/demos/edge-agent-collaboration/page';

// --- classifyPII unit tests ---

describe('classifyPII — edge inference', () => {
  beforeEach(async () => {
    const { _resetPipeline } = await import('@/lib/edge-inference');
    _resetPipeline();
  });

  it('redacts email tokens correctly', async () => {
    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII('Contact us at hello@example.com for support.');
    expect(result.redacted).not.toContain('hello@example.com');
    expect(result.redacted).toContain('[REDACTED:EMAIL]');
    expect(result.redactedFields).toContain('EMAIL');
    expect(result.tier).toBe('edge');
    expect(result.original).toContain('hello@example.com');
    expect(result.processingMs).toBeGreaterThanOrEqual(0);
  });

  it('redacts account number pattern correctly', async () => {
    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII('Account reference: ACC-7829-XK has been updated.');
    expect(result.redacted).not.toContain('ACC-7829-XK');
    expect(result.redacted).toContain('[REDACTED:ACCOUNT_NUMBER]');
    expect(result.redactedFields).toContain('ACCOUNT_NUMBER');
  });

  it('returns correct modelId and tier on result', async () => {
    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII('Plain text with no PII.');
    expect(result.tier).toBe('edge');
    expect(result.modelId).toBe('Xenova/bert-base-NER');
    expect(result.redactedFields).toHaveLength(0);
  });

  it('handles NER load failure gracefully and still applies regex redactions', async () => {
    const { loadTransformersModule } = await import('@/lib/transformers-loader');
    vi.mocked(loadTransformersModule).mockRejectedValueOnce(new Error('NER model unavailable'));

    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII('Billing contact: billing@corp.io is registered.');
    // Regex redaction still works despite NER failure
    expect(result.redacted).toContain('[REDACTED:EMAIL]');
    expect(result.redactedFields).toContain('EMAIL');
  });

  it('redacts multiple PII types in a single document', async () => {
    const { classifyPII } = await import('@/lib/edge-inference');
    const text = 'Email: user@domain.com\nAccount: ACC-1234-AB\nRequest: please process';
    const result = await classifyPII(text);
    expect(result.redactedFields).toContain('EMAIL');
    expect(result.redactedFields).toContain('ACCOUNT_NUMBER');
    expect(result.redacted).not.toContain('user@domain.com');
    expect(result.redacted).not.toContain('ACC-1234-AB');
  });

  it('adds NAME redaction for NER PER entity with defined positions', async () => {
    const { loadTransformersModule } = await import('@/lib/transformers-loader');
    const mockNer = vi.fn().mockResolvedValue([
      { entity_group: 'PER', word: 'Alice', start: 0, end: 5, score: 0.99 },
    ]);
    vi.mocked(loadTransformersModule).mockResolvedValueOnce({
      pipeline: vi.fn().mockResolvedValue(mockNer),
    } as never);
    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII('Alice wants an upgrade.');
    expect(result.redactedFields).toContain('NAME');
    expect(result.redacted).not.toContain('Alice');
  });

  it('skips NER entity with non-PER label (e.g. ORG)', async () => {
    const { loadTransformersModule } = await import('@/lib/transformers-loader');
    const mockNer = vi.fn().mockResolvedValue([
      { entity_group: 'ORG', word: 'Acme', start: 0, end: 4, score: 0.99 },
    ]);
    vi.mocked(loadTransformersModule).mockResolvedValueOnce({
      pipeline: vi.fn().mockResolvedValue(mockNer),
    } as never);
    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII('Acme Corp is our client.');
    expect(result.redactedFields).not.toContain('NAME');
  });

  it('skips NER entity when start/end are undefined', async () => {
    const { loadTransformersModule } = await import('@/lib/transformers-loader');
    const mockNer = vi.fn().mockResolvedValue([
      { entity_group: 'PER', word: 'Bob' }, // no start/end
    ]);
    vi.mocked(loadTransformersModule).mockResolvedValueOnce({
      pipeline: vi.fn().mockResolvedValue(mockNer),
    } as never);
    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII('Bob wants an upgrade.');
    expect(result.redactedFields).not.toContain('NAME');
  });

  it('uses entity.entity fallback label when entity_group is absent', async () => {
    const { loadTransformersModule } = await import('@/lib/transformers-loader');
    const mockNer = vi.fn().mockResolvedValue([
      { entity: 'PER', word: 'Carol', start: 0, end: 5, score: 0.99 },
    ]);
    vi.mocked(loadTransformersModule).mockResolvedValueOnce({
      pipeline: vi.fn().mockResolvedValue(mockNer),
    } as never);
    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII('Carol wants an upgrade.');
    expect(result.redactedFields).toContain('NAME');
  });

  it('skips NER NAME span that overlaps an existing EMAIL span', async () => {
    const { loadTransformersModule } = await import('@/lib/transformers-loader');
    const text = 'Contact: user@example.com for help';
    const emailStart = text.indexOf('user@example.com');
    const mockNer = vi.fn().mockResolvedValue([
      { entity_group: 'PER', word: 'user', start: emailStart, end: emailStart + 4, score: 0.5 },
    ]);
    vi.mocked(loadTransformersModule).mockResolvedValueOnce({
      pipeline: vi.fn().mockResolvedValue(mockNer),
    } as never);
    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII(text);
    expect(result.redactedFields).toContain('EMAIL');
    expect(result.redactedFields).not.toContain('NAME');
  });

  it('adds NAME span when it does not overlap existing regex spans', async () => {
    const { loadTransformersModule } = await import('@/lib/transformers-loader');
    const text = 'David needs help. Contact: david@corp.com';
    const mockNer = vi.fn().mockResolvedValue([
      { entity_group: 'PER', word: 'David', start: 0, end: 5, score: 0.99 },
    ]);
    vi.mocked(loadTransformersModule).mockResolvedValueOnce({
      pipeline: vi.fn().mockResolvedValue(mockNer),
    } as never);
    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII(text);
    expect(result.redactedFields).toContain('NAME');
    expect(result.redactedFields).toContain('EMAIL');
  });

  it('reuses cached NER pipeline on subsequent calls without reload', async () => {
    const { classifyPII } = await import('@/lib/edge-inference');
    await classifyPII('First call: first@example.com');
    const result = await classifyPII('Second call: second@example.org');
    expect(result.redactedFields).toContain('EMAIL');
  });

  it('falls back to empty label when both entity_group and entity are absent', async () => {
    const { loadTransformersModule } = await import('@/lib/transformers-loader');
    const mockNer = vi.fn().mockResolvedValue([
      { word: 'something', start: 0, end: 9, score: 0.5 }, // no entity_group, no entity
    ]);
    vi.mocked(loadTransformersModule).mockResolvedValueOnce({
      pipeline: vi.fn().mockResolvedValue(mockNer),
    } as never);
    const { classifyPII } = await import('@/lib/edge-inference');
    const result = await classifyPII('something else entirely');
    expect(result.redactedFields).not.toContain('NAME');
  });
});

// --- POST /api/edge-agent route tests ---

function makeRequest(body: object, ip = '127.0.0.1') {
  return new Request('http://localhost/api/edge-agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/edge-agent', () => {
  beforeEach(() => {
    _resetStore();
    vi.clearAllMocks();
  });

  it('returns 400 if approvedByUser is false', async () => {
    const { POST } = await import('@/app/api/edge-agent/route');
    const res = await POST(makeRequest({ sanitizedPayload: 'test payload', approvedByUser: false }) as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/approval/i);
  });

  it('returns 400 if approvedByUser is missing', async () => {
    const { POST } = await import('@/app/api/edge-agent/route');
    const res = await POST(makeRequest({ sanitizedPayload: 'test payload' }) as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/approval/i);
  });

  it('returns 400 if sanitizedPayload is empty string', async () => {
    const { POST } = await import('@/app/api/edge-agent/route');
    const res = await POST(makeRequest({ sanitizedPayload: '   ', approvedByUser: true }) as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/empty/i);
  });

  it('returns 400 if sanitizedPayload is missing', async () => {
    const { POST } = await import('@/app/api/edge-agent/route');
    const res = await POST(makeRequest({ approvedByUser: true }) as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/required/i);
  });

  it('returns 400 if sanitizedPayload is too long', async () => {
    const { POST } = await import('@/app/api/edge-agent/route');
    const longPayload = 'a'.repeat(2001);
    const res = await POST(makeRequest({ sanitizedPayload: longPayload, approvedByUser: true }) as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/too long/i);
  });

  it('returns 500 if GROQ_API_KEY is not configured', async () => {
    const saved = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    try {
      const { POST } = await import('@/app/api/edge-agent/route');
      const res = await POST(
        makeRequest({ sanitizedPayload: 'Business request payload', approvedByUser: true }) as Parameters<typeof POST>[0]
      );
      expect(res.status).toBe(500);
    } finally {
      if (saved !== undefined) process.env.GROQ_API_KEY = saved;
    }
  });

  it('returns 200 with summary on successful Groq call', async () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    const { POST } = await import('@/app/api/edge-agent/route');
    const res = await POST(
      makeRequest({ sanitizedPayload: 'Customer requests Enterprise upgrade.', approvedByUser: true }) as Parameters<typeof POST>[0]
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { summary: string; tier: string; model: string; traceId: string };
    expect(body.summary).toBeTruthy();
    expect(body.tier).toBe('cloud');
    expect(body.model).toBe('llama-3.3-70b-versatile');
    expect(body.traceId).toBeTruthy();
  });
});

// --- Demo registry tests ---

describe('edge-agent-collaboration demo registry', () => {
  it('includes edge-agent-collaboration entry in demos.ts', async () => {
    const { demos } = await import('@/data/demos');
    const demo = demos.find((d) => d.id === 'edge-agent-collaboration');
    expect(demo).toBeDefined();
  });

  it('has required tags: edge-ai, governance, privacy-first-ai', async () => {
    const { demos } = await import('@/data/demos');
    const demo = demos.find((d) => d.id === 'edge-agent-collaboration');
    expect(demo?.tags).toContain('edge-ai');
    expect(demo?.tags).toContain('governance');
    expect(demo?.tags).toContain('privacy-first-ai');
  });

  it('has status live', async () => {
    const { demos } = await import('@/data/demos');
    const demo = demos.find((d) => d.id === 'edge-agent-collaboration');
    expect(demo?.status).toBe('live');
  });

  it('has a valid href', async () => {
    const { demos } = await import('@/data/demos');
    const demo = demos.find((d) => d.id === 'edge-agent-collaboration');
    expect(demo?.href).toBe('/demos/edge-agent-collaboration');
  });
});

// --- Page render test ---

describe('EdgeAgentCollaborationPage', () => {
  it('renders without error and shows key structural elements', () => {
    render(React.createElement(EdgeAgentCollaborationPage));
    expect(
      screen.getByRole('heading', { name: /Edge Agent \+ Cloud Agent Collaboration/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Privacy-first browser-side extraction/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Run edge agent local inference/i)).toBeInTheDocument();
  });
});
