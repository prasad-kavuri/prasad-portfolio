import { NextRequest, NextResponse } from 'next/server';
import profile from '@/data/profile.json';
import { detectPromptInjection, sanitizeLLMOutput } from '@/lib/rate-limit';
import {
  enforceRateLimit,
  isStringArray,
  jsonError,
  logApiError,
  logApiEvent,
  logApiWarning,
  readJsonObject,
} from '@/lib/api';

const ROUTE = '/api/resume-generator';

interface ResumeResponse {
  matchScore: number;
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

function isResumeResponse(value: unknown): value is ResumeResponse {
  if (!value || typeof value !== 'object') return false;
  const resume = value as Record<string, unknown>;
  return (
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
}

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  try {
    const rateLimited = await enforceRateLimit(req, 'anonymous', { route: ROUTE });
    if (rateLimited) return rateLimited;

    const body = await readJsonObject(req, { route: ROUTE });
    if (!body.ok) return body.response;

    const { jobDescription, focusAreas } = body.data;

    if (!jobDescription || typeof jobDescription !== 'string' || !jobDescription.trim()) {
      logApiWarning('api.validation_failed', { route: ROUTE, reason: 'missing_job_description', status: 400 });
      return jsonError('Job description is required', 400);
    }

    if (focusAreas !== undefined && !isStringArray(focusAreas, { maxItems: 10, maxItemLength: 100 })) {
      logApiWarning('api.validation_failed', { route: ROUTE, reason: 'invalid_focus_areas', status: 400 });
      return jsonError('Invalid input', 400);
    }
    const safeAreas = focusAreas ?? [];

    if (jobDescription.length > 5000) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, reason: 'job_description_too_long', jobDescriptionLength: jobDescription.length, status: 400 });
      return jsonError('Input too long', 400);
    }
    if (detectPromptInjection(jobDescription)) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, reason: 'prompt_injection', jobDescriptionLength: jobDescription.length, status: 400 });
      return jsonError('Invalid input', 400);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logApiError('api.configuration_error', new Error('Missing GROQ_API_KEY'), { route: ROUTE, status: 500 });
      return jsonError('GROQ_API_KEY not configured', 500);
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

    const systemPrompt = `You are an expert resume writer and ATS optimization specialist.
Your task is to generate a tailored resume JSON for Prasad Kavuri based on a job description.

${PRASAD_PROFILE}

Instructions:
1. Analyze the job description to extract: required skills, seniority level, industry/domain, and key responsibilities
2. Generate a match score (0-100) based on skill alignment
3. Identify matched skills from Prasad's experience
4. Identify missing skills that were requested
5. Write a tailored professional summary (3-4 sentences) that highlights relevant experience
6. Select the 3 most relevant experience entries and tailor bullet points to match JD language
7. Extract the top 8-10 relevant skills
8. Identify 5-7 ATS keywords from the JD

Return ONLY valid JSON, no markdown or additional text.`;

    const userMessage = `Job Description:
${jobDescription}${focusAreasText}

Generate a tailored resume as JSON with this exact structure:
{
  "matchScore": number (0-100),
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
      logApiError('api.upstream_error', new Error('Groq API returned non-OK status'), {
        route: ROUTE,
        upstreamStatus: response.status,
        status: 500,
        durationMs: Date.now() - requestStart,
      });
      return NextResponse.json(
        { error: 'Failed to generate resume from Groq API' },
        { status: 500 }
      );
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
      logApiError('api.llm_parse_error', parseError, {
        route: ROUTE,
        status: 500,
        durationMs: Date.now() - requestStart,
        responseLength: content.length,
      });
      return NextResponse.json(
        { error: 'Failed to generate valid resume. Please try again.' },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!isResumeResponse(parsedResume)) {
      logApiError('api.llm_schema_error', new Error('Invalid resume structure'), {
        route: ROUTE,
        status: 500,
        durationMs: Date.now() - requestStart,
      });
      return NextResponse.json(
        { error: 'Invalid resume structure generated' },
        { status: 500 }
      );
    }

    // Sanitize all string fields before returning
    const sanitized = {
      ...parsedResume,
      summary: sanitizeLLMOutput(parsedResume.summary),
      experience: parsedResume.experience.map(exp => ({
        ...exp,
        bullets: exp.bullets.map(b => sanitizeLLMOutput(b)),
      })),
      skills: parsedResume.skills.map(s => sanitizeLLMOutput(s)),
      matchedSkills: parsedResume.matchedSkills.map(s => sanitizeLLMOutput(s)),
      missingSkills: parsedResume.missingSkills.map(s => sanitizeLLMOutput(s)),
      atsKeywords: parsedResume.atsKeywords.map(k => sanitizeLLMOutput(k)),
    };

    logApiEvent('api.request_completed', {
      route: ROUTE,
      status: 200,
      durationMs: Date.now() - requestStart,
      jobDescriptionLength: jobDescription.length,
      focusAreaCount: safeAreas.length,
      matchScore: parsedResume.matchScore,
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    logApiError('api.request_failed', error, {
      route: ROUTE,
      status: 500,
      durationMs: Date.now() - requestStart,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
