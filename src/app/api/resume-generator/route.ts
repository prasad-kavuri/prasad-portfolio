import { NextRequest, NextResponse } from 'next/server';
import profile from '@/data/profile.json';
import { detectPromptInjection, sanitizeLLMOutput } from '@/lib/guardrails';
import { generateResumeJsonLd, renderJsonLdScript } from '@/lib/resumeJsonLd';
import {
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  isStringArray,
  jsonError,
  captureAndLogApiError,
  logApiEvent,
  logApiWarning,
  readJsonObject,
} from '@/lib/api';

const ROUTE = '/api/resume-generator';
const MAX_JOB_DESCRIPTION_LENGTH = 2000;
const ALLOWED_RESUME_INPUT = /^[\p{L}\p{N}\s.,;:!?'"()/$%+\-#&@|•\[\]\n\r]+$/u;

interface FitDimension {
  score: number;
  rationale: string;
}

interface ResumeResponse {
  matchScore: number;
  roleTitle?: string;
  fitScores?: {
    skillsMatch: FitDimension;
    seniorityAlignment: FitDimension;
    domainRelevance: FitDimension;
    cultureSignals: FitDimension;
  };
  tailoringChanges?: string[];
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    period: string;
    bullets: string[];
  }>;
  skills: string[];
  atsKeywords: string[];
}

function isResumeStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isResumeExperience(value: unknown): value is ResumeResponse['experience'] {
  return Array.isArray(value) && value.every(item => {
    if (!item || typeof item !== 'object') return false;
    const exp = item as Record<string, unknown>;
    return (
      typeof exp.company === 'string' &&
      typeof exp.title === 'string' &&
      typeof exp.period === 'string' &&
      isResumeStringArray(exp.bullets)
    );
  });
}

function isFitDimension(value: unknown): value is FitDimension {
  if (!value || typeof value !== 'object') return false;
  const d = value as Record<string, unknown>;
  return typeof d.score === 'number' && typeof d.rationale === 'string';
}

function isFitScores(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const f = value as Record<string, unknown>;
  return (
    isFitDimension(f.skillsMatch) &&
    isFitDimension(f.seniorityAlignment) &&
    isFitDimension(f.domainRelevance) &&
    isFitDimension(f.cultureSignals)
  );
}

function isResumeResponse(value: unknown): value is ResumeResponse {
  if (!value || typeof value !== 'object') return false;
  const resume = value as Record<string, unknown>;
  const coreValid = (
    typeof resume.matchScore === 'number' &&
    Number.isFinite(resume.matchScore) &&
    resume.matchScore >= 0 &&
    resume.matchScore <= 100 &&
    isResumeStringArray(resume.matchedSkills) &&
    isResumeStringArray(resume.missingSkills) &&
    typeof resume.summary === 'string' &&
    isResumeExperience(resume.experience) &&
    isResumeStringArray(resume.skills) &&
    isResumeStringArray(resume.atsKeywords)
  );
  if (!coreValid) return false;
  // Optional fields: validate only if present
  if (resume.fitScores !== undefined && !isFitScores(resume.fitScores)) return false;
  if (resume.tailoringChanges !== undefined && !isResumeStringArray(resume.tailoringChanges)) return false;
  return true;
}

function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
}

function escapeSpecialCharacters(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeWhitespace(input: string): string {
  return input.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function sanitizeResumeInput(input: string): string {
  return escapeSpecialCharacters(normalizeWhitespace(stripHtml(input)));
}

function sanitizeResumeOutput(input: string): string {
  return sanitizeResumeInput(sanitizeLLMOutput(input));
}

function hasAllowedResumeCharacters(input: string): boolean {
  return ALLOWED_RESUME_INPUT.test(input);
}

export async function POST(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  try {
    const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
    if (rateLimited) return rateLimited;

    const body = await readJsonObject(req, { context });
    if (!body.ok) return body.response;

    const { jobDescription, focusAreas, userOverride } = body.data;

    if (!jobDescription || typeof jobDescription !== 'string' || !jobDescription.trim()) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'missing_job_description', status: 400 });
      return finalizeApiResponse(jsonError('Job description is required', 400, { context }), context);
    }

    if (focusAreas !== undefined && !isStringArray(focusAreas, { maxItems: 10, maxItemLength: 100 })) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_focus_areas', status: 400 });
      return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
    }
    const safeAreas = (focusAreas ?? []).map(area => sanitizeResumeInput(area));

    let safeUserOverride = '';
    if (userOverride !== undefined) {
      if (typeof userOverride !== 'string' || userOverride.length > 500) {
        return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
      }
      safeUserOverride = sanitizeResumeInput(userOverride);
    }

    if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'job_description_too_long', jobDescriptionLength: jobDescription.length, status: 400 });
      return finalizeApiResponse(jsonError('Input too long', 400, { context }), context);
    }
    const injectionIssues = detectPromptInjection(jobDescription);
    const hasNonTemplateInjection = injectionIssues.some(issue => issue !== 'template_injection');
    if (hasNonTemplateInjection) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'prompt_injection', jobDescriptionLength: jobDescription.length, status: 400 });
      return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
    }
    const safeJobDescription = sanitizeResumeInput(jobDescription);
    if (!safeJobDescription || !hasAllowedResumeCharacters(safeJobDescription) || !safeAreas.every(hasAllowedResumeCharacters)) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'disallowed_resume_characters', status: 400 });
      return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      captureAndLogApiError('api.configuration_error', new Error('Missing GROQ_API_KEY'), { route: ROUTE, traceId: context.traceId, status: 500 });
      return finalizeApiResponse(jsonError('GROQ_API_KEY not configured', 500, { context }), context);
    }

    const focusAreasText = safeAreas.length > 0 ? `\nFocus areas: ${safeAreas.join(', ')}` : '';

    // Build dynamically from profile data
    const topExperience = profile.experience.slice(0, 3)
      .map(exp => `${exp.company} - ${exp.title}: ${exp.highlights.join('. ')}`)
      .join('\n\n');

    const PRASAD_PROFILE = `PRASAD KAVURI - COMPLETE PROFILE FOR RESUME GENERATION:

${topExperience}

Education:
- MBA Strategic Marketing, Northern Illinois University (2012-2014)
- MCA, Osmania University (1999-2002)
- BSc Computer Maintenance & Engineering, Osmania University (1996-1999)

Skills: Agentic AI, LLM Orchestration, RAG, Vector Search, CrewAI, LangGraph,
AWS/Azure/GCP, Kubernetes, MLOps, LLMOps, Product Strategy, Data Platforms,
Distributed Systems, P&L Management, Global Team Leadership`;

    const systemPrompt = `You are an expert resume writer, ATS optimization specialist, and hiring intelligence system.
Your task is to analyze a job description and generate a tailored resume JSON for Prasad Kavuri.

${PRASAD_PROFILE}

Instructions:
1. Extract the role title from the job description
2. Generate a match score (0-100) based on overall skill alignment
3. Score 4 dimensions (0-100 each) with a one-sentence rationale:
   - skillsMatch: How well Prasad's technical skills match the JD requirements
   - seniorityAlignment: How well Prasad's seniority/level matches the role expectations
   - domainRelevance: How relevant Prasad's domain experience is to this role
   - cultureSignals: How well Prasad's background aligns with company culture signals in the JD
4. Identify matched skills from Prasad's experience
5. Identify missing skills that were requested
6. Propose exactly 3 concrete resume tailoring changes (as short action phrases)
7. Write a tailored professional summary (3-4 sentences) that highlights relevant experience
8. Select the 3 most relevant experience entries and tailor bullet points to match JD language
9. Extract the top 8-10 relevant skills
10. Identify 5-7 ATS keywords from the JD

Return ONLY valid JSON, no markdown or additional text.`;

    const overrideClause = safeUserOverride
      ? `\n\nUser tailoring override: ${safeUserOverride}\nApply this override when writing the summary, experience bullets, and tailoringChanges.`
      : '';

    const userMessage = `Job Description:
${safeJobDescription}${focusAreasText}${overrideClause}

Generate a tailored resume as JSON with this exact structure:
{
  "matchScore": number (0-100),
  "roleTitle": "string",
  "fitScores": {
    "skillsMatch": { "score": number, "rationale": "string" },
    "seniorityAlignment": { "score": number, "rationale": "string" },
    "domainRelevance": { "score": number, "rationale": "string" },
    "cultureSignals": { "score": number, "rationale": "string" }
  },
  "tailoringChanges": ["change1", "change2", "change3"],
  "matchedSkills": string[],
  "missingSkills": string[],
  "summary": "string (3-4 sentences)",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "period": "string",
      "bullets": ["bullet1", "bullet2", "bullet3"]
    }
  ],
  "skills": ["skill1", "skill2", ...],
  "atsKeywords": ["keyword1", "keyword2", ...]
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      await response.text().catch(() => '');
      captureAndLogApiError('api.upstream_error', new Error('Groq API returned non-OK status'), {
        route: ROUTE,
        traceId: context.traceId,
        upstreamStatus: response.status,
        status: 500,
        durationMs: Date.now() - context.startedAt,
      });
      return finalizeApiResponse(jsonError('Failed to generate resume from Groq API', 500, { context }), context);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse JSON from the response
    let parsedResume: unknown;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedResume = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      captureAndLogApiError('api.llm_parse_error', parseError, {
        route: ROUTE,
        traceId: context.traceId,
        status: 500,
        durationMs: Date.now() - context.startedAt,
        responseLength: content.length,
      });
      return finalizeApiResponse(jsonError('Failed to generate valid resume. Please try again.', 500, { context }), context);
    }

    // Validate the response structure
    if (!isResumeResponse(parsedResume)) {
      captureAndLogApiError('api.llm_schema_error', new Error('Invalid resume structure'), {
        route: ROUTE,
        traceId: context.traceId,
        status: 500,
        durationMs: Date.now() - context.startedAt,
      });
      return finalizeApiResponse(jsonError('Invalid resume structure generated', 500, { context }), context);
    }

    // Sanitize all string fields before returning
    const sanitized = {
      ...parsedResume,
      roleTitle: parsedResume.roleTitle ? sanitizeResumeOutput(parsedResume.roleTitle) : undefined,
      fitScores: parsedResume.fitScores ? {
        skillsMatch: { ...parsedResume.fitScores.skillsMatch, rationale: sanitizeResumeOutput(parsedResume.fitScores.skillsMatch.rationale) },
        seniorityAlignment: { ...parsedResume.fitScores.seniorityAlignment, rationale: sanitizeResumeOutput(parsedResume.fitScores.seniorityAlignment.rationale) },
        domainRelevance: { ...parsedResume.fitScores.domainRelevance, rationale: sanitizeResumeOutput(parsedResume.fitScores.domainRelevance.rationale) },
        cultureSignals: { ...parsedResume.fitScores.cultureSignals, rationale: sanitizeResumeOutput(parsedResume.fitScores.cultureSignals.rationale) },
      } : undefined,
      tailoringChanges: parsedResume.tailoringChanges?.map(c => sanitizeResumeOutput(c)),
      summary: sanitizeResumeOutput(parsedResume.summary),
      experience: parsedResume.experience.map(exp => ({
        ...exp,
        company: sanitizeResumeOutput(exp.company),
        title: sanitizeResumeOutput(exp.title),
        period: sanitizeResumeOutput(exp.period),
        bullets: exp.bullets.map(b => sanitizeResumeOutput(b)),
      })),
      skills: parsedResume.skills.map(s => sanitizeResumeOutput(s)),
      matchedSkills: parsedResume.matchedSkills.map(s => sanitizeResumeOutput(s)),
      missingSkills: parsedResume.missingSkills.map(s => sanitizeResumeOutput(s)),
      atsKeywords: parsedResume.atsKeywords.map(k => sanitizeResumeOutput(k)),
    };

    // Generate schema.org/Person JSON-LD for ATS machine-readability
    const personal = ((profile.personal as unknown as Record<string, string> | undefined) ?? {}) as Record<string, string>;
    const education = ((profile.education as unknown as Array<Record<string, string>> | undefined) ?? []);
    const jsonLd = generateResumeJsonLd({
      name: personal.name ?? 'Prasad Kavuri',
      headline: personal.title,
      location: personal.location,
      summary: sanitized.summary,
      skills: sanitized.skills,
      experience: sanitized.experience.map(exp => ({
        title: exp.title,
        company: exp.company,
        endDate: /present/i.test(exp.period) ? 'Present' : exp.period.match(/\d{4}\s*$/)?.[0],
        description: exp.bullets.join(' '),
      })),
      education: education.map(edu => ({
        degree: edu.degree,
        institution: edu.institution,
        fieldOfStudy: edu.field,
      })),
      urls: {
        linkedin:  personal.linkedin,
        github:    personal.github,
        portfolio: personal.portfolio,
      },
    }, 'https://www.prasadkavuri.com/demos/resume-generator');

    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs: Date.now() - context.startedAt,
      jobDescriptionLength: jobDescription.length,
      focusAreaCount: safeAreas.length,
      matchScore: parsedResume.matchScore,
      hasUserOverride: safeUserOverride.length > 0,
    });

    return finalizeApiResponse(
      NextResponse.json({ ...sanitized, jsonLd, jsonLdScript: renderJsonLdScript(jsonLd) }),
      context
    );
  } catch (error) {
    captureAndLogApiError('api.request_failed', error, {
      route: ROUTE,
      traceId: context.traceId,
      status: 500,
      durationMs: Date.now() - context.startedAt,
    });
    return finalizeApiResponse(jsonError('Internal server error', 500, { context }), context);
  }
}
