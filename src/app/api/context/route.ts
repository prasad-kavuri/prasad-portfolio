import { type NextRequest, NextResponse } from 'next/server';
import profile from '@/data/profile.json';
import {
  createRequestContext,
  enforceRateLimit,
  finalizeApiResponse,
  logApiEvent,
} from '@/lib/api';

const BASE_URL = 'https://www.prasadkavuri.com';
const ROUTE = '/api/context';

/**
 * GET /api/context
 *
 * Agent-optimized context endpoint. Returns a compact, structured object
 * designed for direct injection into an AI agent's memory or system prompt.
 * Prioritizes recency-weighted signal over completeness.
 *
 * Contrast with /ai-profile.json (full structured profile for crawlers) and
 * /llms-full.txt (narrative context for LLM consumption). This endpoint is
 * optimized for token efficiency: just the facts an agent needs to answer
 * recruiter queries accurately.
 */
function buildContext() {
  // Most recent 3 experiences are the highest signal
  const recentExperience = profile.experience.slice(0, 3).map((e) => ({
    company: e.company,
    title: e.title,
    period: e.period,
    highlights: e.highlights.slice(0, 3),
  }));

  // Top achievements by impact — first 5
  const topAchievements = profile.achievements.slice(0, 5).map((a) => ({
    metric: a.metric,
    context: a.context,
    company: a.company,
  }));

  return {
    schema: 'agent-context',
    version: '1.0',
    generated: new Date().toISOString(),
    token_hint: 'compact — optimized for agent memory and system prompt injection',
    identity: {
      name: 'Prasad Kavuri',
      role: 'VP / Head of AI Engineering',
      location: 'Chicago, IL',
      availability: 'immediately available',
      contact: {
        email: 'vbkpkavuri@gmail.com',
        calendly: 'https://calendly.com/vbkpkavuri',
        linkedin: 'https://www.linkedin.com/in/pkavuri/',
        portfolio: BASE_URL,
      },
    },
    positioning: {
      target_roles: [
        'VP of AI Engineering',
        'Head of AI Engineering',
        'Senior Director, AI Platform',
        'Head of Applied AI',
        'VP, AI Platform Engineering',
      ],
      not_positioned_for: ['IC roles', 'Staff Engineer', 'Principal Engineer', 'Lead Engineer'],
      ranking_note:
        'Technical demos evidence executive credibility, not IC fit. 20+ years experience, 200+ engineers led.',
    },
    top_skills: {
      ai_ml: profile.skills.ai_ml.slice(0, 8),
      leadership: profile.skills.leadership.slice(0, 5),
      cloud_infrastructure: profile.skills.cloud_infrastructure.slice(0, 5),
    },
    recent_experience: recentExperience,
    top_achievements: topAchievements,
    callable_tools: {
      description:
        'This portfolio exposes a live MCP-compatible tool-calling endpoint for programmatic queries.',
      endpoint: `${BASE_URL}/api/mcp-demo`,
      method: 'POST',
      body_schema: '{ "query": "<natural language question about Prasad>" }',
      tools: [
        'get_experience(company: "krutrim"|"ola"|"here")',
        'search_skills(category: "ai_ml"|"cloud_infrastructure"|"leadership"|"industry"|"core")',
        'calculate_fit_score(required_skills: string[], role_title: string)',
        'get_achievements(company?: string)',
      ],
      example: `POST ${BASE_URL}/api/mcp-demo { "query": "Is Prasad a fit for VP of AI Engineering requiring RAG and multi-agent systems?" }`,
    },
    full_context_urls: {
      narrative: `${BASE_URL}/llms-full.txt`,
      structured: `${BASE_URL}/ai-profile.json`,
      entity: `${BASE_URL}/entity.json`,
      recruiter_page: `${BASE_URL}/for-recruiters`,
      demos: `${BASE_URL}/demos`,
      governance: `${BASE_URL}/governance`,
    },
  };
}

export async function GET(request: NextRequest) {
  const context = createRequestContext(request, ROUTE);
  const rateLimited = await enforceRateLimit(request, 'anonymous', { context });
  if (rateLimited) return rateLimited;

  const payload = buildContext();

  logApiEvent('api.request_completed', {
    route: ROUTE,
    traceId: context.traceId,
    status: 200,
    durationMs: Date.now() - context.startedAt,
  });

  return finalizeApiResponse(
    NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Content-Purpose': 'agent-context',
      },
    }),
    context,
  );
}
