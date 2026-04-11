import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('@/data/profile.json', () => ({
  default: {
    experience: [
      {
        company: 'Krutrim',
        title: 'Head of AI Engineering',
        period: '2025–Present',
        highlights: ['Built agentic AI platform at scale'],
      },
    ],
  },
}));

const VALID_RESUME: object = {
  matchScore: 90,
  matchedSkills: ['LLM Orchestration', 'RAG'],
  missingSkills: [],
  summary: 'Experienced AI engineer.',
  experience: [
    {
      company: 'Krutrim',
      title: 'Head of AI Engineering',
      period: '2025–Present',
      bullets: ['Led agentic AI platform'],
    },
  ],
  skills: ['LLM Orchestration'],
  atsKeywords: ['AI', 'LLM'],
};

function makeRequest(body: object, ip = '127.0.0.1') {
  return new NextRequest('http://localhost/api/resume-generator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/resume-generator', () => {
  beforeEach(() => {
    _resetStore();
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it('returns 400 when jobDescription is missing', async () => {
    const { POST } = await import('@/app/api/resume-generator/route');
    const res = await POST(makeRequest({ focusAreas: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/job description is required/i);
  });

  it('returns 400 when jobDescription is empty string', async () => {
    const { POST } = await import('@/app/api/resume-generator/route');
    const res = await POST(makeRequest({ jobDescription: '   ', focusAreas: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when jobDescription exceeds 500 characters', async () => {
    const { POST } = await import('@/app/api/resume-generator/route');
    const res = await POST(makeRequest({ jobDescription: 'j'.repeat(501), focusAreas: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/too long/i);
  });

  it('returns 500 when GROQ_API_KEY is not set', async () => {
    delete process.env.GROQ_API_KEY;
    const { POST } = await import('@/app/api/resume-generator/route');
    const res = await POST(makeRequest({ jobDescription: 'VP of AI role', focusAreas: [] }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/GROQ_API_KEY/);
  });

  it('returns 429 after 10 requests from the same IP', async () => {
    delete process.env.GROQ_API_KEY; // exit early at key check; counter still increments
    const { POST } = await import('@/app/api/resume-generator/route');
    const ip = '10.0.0.3';
    const body = { jobDescription: 'VP of AI role', focusAreas: [] };

    for (let i = 0; i < 10; i++) {
      await POST(makeRequest(body, ip));
    }

    const res = await POST(makeRequest(body, ip));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toMatch(/too many requests/i);
  });

  it('returns a parsed resume when Groq responds with valid JSON', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(VALID_RESUME) } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const { POST } = await import('@/app/api/resume-generator/route');
    const res = await POST(
      makeRequest({ jobDescription: 'Looking for a VP of AI Engineering', focusAreas: ['AI'] })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('matchScore', 90);
    expect(body).toHaveProperty('summary');
    expect(body.matchedSkills).toContain('LLM Orchestration');
  });
});
