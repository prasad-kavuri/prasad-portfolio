import { NextRequest, NextResponse } from 'next/server';
import profile from '@/data/profile.json';
import {
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  jsonError,
  captureAndLogApiError,
  logApiEvent,
  logApiWarning,
  readJsonObject,
} from '@/lib/api';
import { startTimer, detectAnomaly, logAPIEvent } from '@/lib/observability';
import { detectPromptInjection, sanitizeLLMOutput, checkOutput } from '@/lib/guardrails';
import { trackModelOutput } from '@/lib/drift-monitor';

const ROUTE = '/api/storm-research';
const MAX_TOPIC_LENGTH = 200;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

interface ProfileExperience {
  title: string;
  company: string;
  period: string;
  highlights: string[];
}

function buildProfileContext(): string {
  const experiences = profile.experience as ProfileExperience[];
  const exp = experiences
    .slice(0, 4)
    .map(e => `• ${e.title} at ${e.company} (${e.period}): ${e.highlights.slice(0, 2).join(' ')}`)
    .join('\n');
  return `CANDIDATE PROFILE:\nName: ${profile.personal.name}\nTitle: ${profile.personal.title}\nSummary: ${profile.personal.summary.slice(0, 500)}\n\nRecent Experience:\n${exp}`;
}

async function callGroq(apiKey: string, system: string, user: string, maxTokens = 1024): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      stream: false,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJsonArray(text: string, fallback: string[]): string[] {
  try {
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed: unknown = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.every((s): s is string => typeof s === 'string')) return parsed;
    }
  } catch { /* fallthrough */ }
  return fallback;
}

function parseJsonObject(text: string, fallback: Record<string, string[]>): Record<string, string[]> {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed: unknown = JSON.parse(match[0]);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const result: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (Array.isArray(v) && v.every((s): s is string => typeof s === 'string')) {
            result[k] = v;
          }
        }
        if (Object.keys(result).length > 0) return result;
      }
    }
  } catch { /* fallthrough */ }
  return fallback;
}

function writeLine(
  controller: ReadableStreamDefaultController<Uint8Array>,
  msg: object,
  encoder: TextEncoder,
): void {
  controller.enqueue(encoder.encode(JSON.stringify(msg) + '\n'));
}

export async function POST(req: NextRequest) {
  const elapsed = startTimer();
  const context = createRequestContext(req, ROUTE);

  try {
    const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
    if (rateLimited) return rateLimited;

    const body = await readJsonObject(req, { context });
    if (!body.ok) return body.response;

    const { topic } = body.data;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'missing_topic', status: 400 });
      return finalizeApiResponse(jsonError('Topic is required', 400, { context }), context);
    }
    const cleanTopic = topic.trim();
    if (cleanTopic.length > MAX_TOPIC_LENGTH) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'topic_too_long', status: 400 });
      return finalizeApiResponse(jsonError('Topic too long (max 200 characters)', 400, { context }), context);
    }
    if (detectPromptInjection(cleanTopic).length > 0) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'prompt_injection', status: 400 });
      return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      captureAndLogApiError('api.configuration_error', new Error('Missing GROQ_API_KEY'), { route: ROUTE, traceId: context.traceId, status: 500 });
      return finalizeApiResponse(jsonError('Service configuration error', 500, { context }), context);
    }

    const profileCtx = buildProfileContext();
    const encoder = new TextEncoder();
    const DEFAULT_PERSPECTIVES = ['ML Engineer', 'Executive Recruiter', 'Security Architect', 'Product Manager'];
    const isCompanyTopic = /anthropic|stripe|openai|zip\b|google|meta|microsoft|amazon|apple|uber|airbnb|figma|notion|linear|vercel|deepmind/i.test(cleanTopic);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let fullOutput = '';
        try {
          // ── Phase 1: Perspective Discovery ───────────────────────────────
          writeLine(controller, { type: 'phase', phase: 'perspectives', label: 'Discovering Perspectives' }, encoder);

          const perspRaw = await callGroq(
            apiKey,
            'You are a research orchestrator. Respond with a valid JSON array only — no markdown, no extra text.',
            `For the research topic: "${cleanTopic}", identify exactly 3-4 expert perspectives that provide diverse, high-value insights. Return a JSON array of short role labels, e.g. ["ML Engineer", "Executive Recruiter", "Security Architect", "Product Manager"].`,
            256,
          );
          const perspectives = parseJsonArray(perspRaw, DEFAULT_PERSPECTIVES).slice(0, 4);
          writeLine(controller, { type: 'perspectives', data: perspectives }, encoder);
          fullOutput += perspRaw;

          // ── Phase 2: Question Generation ─────────────────────────────────
          writeLine(controller, { type: 'phase', phase: 'questions', label: 'Generating Questions' }, encoder);

          const fallbackQuestions: Record<string, string[]> = {};
          perspectives.forEach(p => {
            fallbackQuestions[p] = [
              `What are the key considerations for "${cleanTopic}" from a ${p} standpoint?`,
              `What are the main risks or gaps to evaluate?`,
              `What strengths or opportunities stand out?`,
            ];
          });

          const questionsRaw = await callGroq(
            apiKey,
            'You are a research orchestrator. Respond with a valid JSON object only — no markdown, no extra text.',
            `For the topic "${cleanTopic}" and these perspectives: ${perspectives.join(', ')}, generate exactly 3 focused research questions per perspective. Return a JSON object where each key is a perspective name and the value is an array of 3 question strings.`,
            1024,
          );
          const questions = parseJsonObject(questionsRaw, fallbackQuestions);
          perspectives.forEach(p => { if (!questions[p]) questions[p] = fallbackQuestions[p]; });
          writeLine(controller, { type: 'questions', data: questions }, encoder);
          fullOutput += questionsRaw;

          // ── Phase 3: Research (sequential per perspective) ───────────────
          writeLine(controller, { type: 'phase', phase: 'research', label: 'Researching' }, encoder);

          for (const perspective of perspectives) {
            const qs = questions[perspective] ?? fallbackQuestions[perspective];

            const researchSystem = isCompanyTopic
              ? `You are a ${perspective} evaluating a VP of AI Engineering candidate for ${cleanTopic}. Use the candidate profile below to provide specific, evidence-based assessments.\n\n${profileCtx}`
              : `You are a ${perspective} researching "${cleanTopic}". Provide expert, specific insights from your professional perspective.`;

            const researchRaw = await callGroq(
              apiKey,
              researchSystem,
              `Answer these 3 questions about "${cleanTopic}" from the perspective of a ${perspective}:\n1. ${qs[0]}\n2. ${qs[1]}\n3. ${qs[2]}\n\nFormat your response as:\n1. [answer]\n2. [answer]\n3. [answer]\n\nBe concise and specific (2-3 sentences each).`,
              900,
            );
            const sanitized = sanitizeLLMOutput(researchRaw);

            const answers = qs.map((question, i) => {
              const pattern = new RegExp(`${i + 1}[.)\\s]+([\\s\\S]*?)(?=\\n${i + 2}[.)\\s]|$)`);
              const match = sanitized.match(pattern);
              const answer = match?.[1]?.trim() ?? sanitized.split('\n').filter(l => l.trim())[i] ?? '';
              return { question, answer: answer.slice(0, 600) };
            });

            writeLine(controller, { type: 'answers', perspective, data: answers }, encoder);
            fullOutput += researchRaw;
          }

          // ── Phase 4: Report Synthesis ────────────────────────────────────
          writeLine(controller, { type: 'phase', phase: 'synthesis', label: 'Synthesizing Report' }, encoder);

          const researchSummary = perspectives.map(p => {
            const qs = questions[p] ?? [];
            return `${p}:\n${qs.map((q, i) => `  Q${i + 1}: ${q}`).join('\n')}`;
          }).join('\n\n');

          const synthSystem = isCompanyTopic
            ? `You are a senior analyst synthesizing multi-perspective research. Write executive-grade reports.\n\nCandidate profile for context:\n${profileCtx}`
            : 'You are a senior analyst synthesizing multi-perspective research. Write clear, executive-grade reports.';

          const reportRaw = await callGroq(
            apiKey,
            synthSystem,
            `Synthesize this multi-perspective research on "${cleanTopic}" into a structured executive brief.\n\nResearch coverage:\n${researchSummary}\n\nWrite a report using these sections (use ## for each header):\n## Executive Summary\n## Perspective Findings\n## Key Strengths\n## Risks & Gaps\n## Opportunities\n## Recommended Next Steps\n\nBe specific and actionable. 400-600 words total.`,
            1500,
          );
          const reportSanitized = sanitizeLLMOutput(reportRaw);

          const guardResult = checkOutput(reportSanitized, context.traceId);
          if (!guardResult.isSafe) {
            logApiWarning('api.guardrail_output_triggered', {
              route: ROUTE,
              traceId: context.traceId,
              issues: guardResult.issues.join(','),
              score: guardResult.score,
              status: 200,
            });
          }

          writeLine(controller, { type: 'report', data: reportSanitized }, encoder);
          writeLine(controller, { type: 'done' }, encoder);

          fullOutput += reportRaw;
          trackModelOutput(ROUTE, fullOutput, 'success');

          const totalDuration = elapsed();
          logApiEvent('api.request_completed', {
            route: ROUTE,
            traceId: context.traceId,
            status: 200,
            durationMs: totalDuration,
            topic: cleanTopic.slice(0, 50),
            perspectives: perspectives.length,
          });

          const anomaly = detectAnomaly(totalDuration, 200);
          if (anomaly.anomaly) {
            logAPIEvent({
              event: 'api.anomaly_detected',
              route: ROUTE,
              traceId: context.traceId,
              severity: 'warn',
              durationMs: totalDuration,
              statusCode: 200,
              reasons: anomaly.reasons.join('; '),
            });
          }
        } catch (error) {
          trackModelOutput(ROUTE, error instanceof Error ? error.name : 'stream_error', 'error');
          captureAndLogApiError('api.stream_error', error, {
            route: ROUTE,
            traceId: context.traceId,
            status: 500,
            durationMs: elapsed(),
          });
          writeLine(controller, { type: 'error', message: 'Research failed. Please try again.' }, encoder);
        } finally {
          controller.close();
        }
      },
    });

    return finalizeApiResponse(
      new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'X-Trace-Id': context.traceId,
        },
      }),
      context,
    );
  } catch (error) {
    const durationMs = elapsed();
    trackModelOutput(ROUTE, error instanceof Error ? error.name : 'request_failed', 'error');
    captureAndLogApiError('api.request_failed', error, { route: ROUTE, traceId: context.traceId, status: 500, durationMs });
    return finalizeApiResponse(jsonError('Internal server error', 500, { context }), context);
  }
}
