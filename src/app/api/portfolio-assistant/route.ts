import { NextRequest, NextResponse } from 'next/server';
import profile from '@/data/profile.json';
import {
  enforceRateLimit,
  createRequestContext,
  finalizeApiResponse,
  getClientIp,
  jsonError,
  captureAndLogApiError,
  logApiEvent,
  logApiWarning,
  readJsonObject,
} from '@/lib/api';
import { detectAnomaly, logAPIEvent, startTimer } from '@/lib/observability';
import { enforceCostControls } from '@/lib/cost-control';
import { trackModelOutput } from '@/lib/drift-monitor';
import { checkOutput, isPromptInjection as detectPromptInjection, sanitizeLLMOutput } from '@/lib/guardrails';
import { logQueryForEval } from '@/lib/query-log';

const ROUTE = '/api/portfolio-assistant';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Simple keyword-based RAG retrieval
function retrieveRelevantDocuments(query: string, topK = 3) {
  const keywords = query.toLowerCase().split(/\s+/);
  const knowledgeBase = profile.knowledgeBase.map((content, idx) => ({
    id: `doc-${idx}`,
    title: `Profile Point ${idx + 1}`,
    content,
  }));

  const scored = knowledgeBase.map(doc => {
    const text = (doc.title + ' ' + doc.content).toLowerCase();
    const score = keywords.filter(kw => text.includes(kw)).length;
    return { ...doc, score };
  });
  return scored
    .filter(doc => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ score, ...doc }) => doc);
}

// User messages are limited tightly (security). Assistant messages can be
// much longer — up to ~1024 tokens ≈ 4000–8000 chars from Groq responses.
// Applying the 1000-char user limit to all messages caused every second
// request to fail because the previous assistant response exceeded it.
const MAX_USER_MSG_LEN = 1000;
const MAX_ASSISTANT_MSG_LEN = 8192;

function validateMessages(value: unknown): Message[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) return null;

  const messages: Message[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const limit = role === 'user' ? MAX_USER_MSG_LEN : MAX_ASSISTANT_MSG_LEN;
    if (content.length > limit) return null;
    messages.push({ role, content });
  }

  return messages;
}

export async function POST(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const elapsed = startTimer();
  try {
    const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
    if (rateLimited) return rateLimited;

    const body = await readJsonObject(req, { context });
    if (!body.ok) return body.response;

    const messages = validateMessages(body.data.messages);
    if (!messages) {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_messages', status: 400 });
      return finalizeApiResponse(jsonError('Messages are required', 400, { context }), context);
    }

    if (body.data.useRAG !== undefined && typeof body.data.useRAG !== 'boolean') {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_use_rag', status: 400 });
      return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
    }
    if (body.data.approvalState !== undefined && body.data.approvalState !== 'pending' && body.data.approvalState !== 'approved') {
      logApiWarning('api.validation_failed', { route: ROUTE, traceId: context.traceId, reason: 'invalid_approval_state', status: 400 });
      return finalizeApiResponse(jsonError('Invalid approval state', 400, { context }), context);
    }
    const useRAG = body.data.useRAG === true;

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage && lastUserMessage.content.length > 500) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'message_too_long', messageLength: lastUserMessage.content.length, status: 400 });
      return finalizeApiResponse(jsonError('Input too long', 400, { context }), context);
    }
    if (lastUserMessage && detectPromptInjection(lastUserMessage.content)) {
      logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'prompt_injection', messageLength: lastUserMessage.content.length, status: 400 });
      return finalizeApiResponse(jsonError('Invalid input', 400, { context }), context);
    }
    if (lastUserMessage) {
      const costControl = enforceCostControls({
        route: ROUTE,
        userKey: getClientIp(req, 'anonymous'),
        prompt: lastUserMessage.content,
        requestedModel: 'llama-3.1-8b-instant',
        maxTokens: 100,
      });
      if (!costControl.allowed) {
        logApiWarning('api.cost_control_blocked', {
          route: ROUTE,
          traceId: context.traceId,
          reason: costControl.reason,
          estimatedTokens: costControl.estimatedTokens,
          status: 429,
        });
        return finalizeApiResponse(jsonError('AI request limit exceeded. Please shorten the prompt or try again shortly.', 429, { context }), context);
      }
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      captureAndLogApiError('api.configuration_error', new Error('Missing GROQ_API_KEY'), { route: ROUTE, traceId: context.traceId, status: 500 });
      return finalizeApiResponse(jsonError('GROQ_API_KEY not configured', 500, { context }), context);
    }

    // Always inject full knowledge base as base context
    const fullContext = profile.knowledgeBase.join('\n\n');

    const systemPrompt = `You are Prasad Kavuri's AI portfolio assistant.
You have complete knowledge about Prasad's professional background.
Answer questions accurately and specifically using the information below.
Be concise but informative. Never say you lack context — you have it all below.

PRASAD KAVURI - COMPLETE PROFILE:
${fullContext}`;

    let retrievedDocs: Array<{ id: string; title: string; content: string }> = [];

    // Additionally highlight most relevant docs if RAG is enabled
    if (useRAG && lastUserMessage) {
      retrievedDocs = retrieveRelevantDocuments(lastUserMessage.content);
    }

    // Limit conversation history to last 6 messages to prevent context overflow.
    // System prompt + full knowledgeBase already consumes most of the context window.
    const recentMessages = messages.slice(-6);

    // Prepare messages for Groq API
    const groqMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentMessages,
    ];

    // Call Groq API with streaming
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      await response.text().catch(() => '');
      trackModelOutput(ROUTE, `upstream_error:${response.status}`, 'error');
      captureAndLogApiError('api.upstream_error', new Error('Groq API returned non-OK status'), {
        route: ROUTE,
        traceId: context.traceId,
        upstreamStatus: response.status,
        status: 500,
        durationMs: Date.now() - context.startedAt,
      });
      return finalizeApiResponse(jsonError('Failed to get response from Groq API', 500, { context }), context);
    }

    // Create a readable stream for streaming response
    const encoder = new TextEncoder();
    let buffer = '';
    let streamedOutput = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += new TextDecoder().decode(value);
            const lines = buffer.split('\n');

            // Process complete lines
            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i].trim();
              if (!line || line === 'data: [DONE]') continue;

              if (line.startsWith('data: ')) {
                try {
                  const json = JSON.parse(line.slice(6));
                  const content = json.choices?.[0]?.delta?.content || '';
                  if (content) {
                    const sanitizedChunk = sanitizeLLMOutput(content);
                    streamedOutput += sanitizedChunk;
                    controller.enqueue(encoder.encode(sanitizedChunk));
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }

            // Keep incomplete line in buffer
            buffer = lines[lines.length - 1];
          }

          // Include retrieved documents metadata at the end
          if (retrievedDocs.length > 0) {
            const metadata = `\n\n[Retrieved ${retrievedDocs.length} documents]`;
            controller.enqueue(encoder.encode(metadata));
          }

          controller.close();
        } catch (error) {
          trackModelOutput(ROUTE, error instanceof Error ? error.name : 'stream_error', 'error');
          controller.error(error);
        } finally {
          if (streamedOutput) {
            trackModelOutput(ROUTE, streamedOutput, 'success');

            // Output guardrail check — log warning on unsafe content
            const guardResult = checkOutput(streamedOutput, context.traceId);
            if (!guardResult.isSafe) {
              logApiWarning('api.guardrail_output_triggered', {
                route: ROUTE,
                traceId: context.traceId,
                issues: guardResult.issues.join(','),
                score: guardResult.score,
                status: 200,
              });
            }

            // Runtime eval loop — log anonymized query+response for live scoring
            if (lastUserMessage) {
              logQueryForEval(ROUTE, lastUserMessage.content, streamedOutput, context.traceId);
            }
          }
          reader.releaseLock();
        }
      },
    });

    const totalDuration = elapsed();
    logApiEvent('api.request_completed', {
      route: ROUTE,
      traceId: context.traceId,
      status: 200,
      durationMs: totalDuration,
      messageCount: recentMessages.length,
      useRAG,
      retrievedDocs: retrievedDocs.length,
    });

    const anomaly = detectAnomaly(totalDuration, 200);
    if (anomaly.anomaly) {
      logAPIEvent({ event: 'api.anomaly_detected', route: ROUTE, traceId: context.traceId, severity: 'warn', durationMs: totalDuration, statusCode: 200, reasons: anomaly.reasons.join('; ') });
    }

    return finalizeApiResponse(new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Retrieved-Docs': JSON.stringify(retrievedDocs.map(({ id, title }) => ({ id, title }))),
      },
    }), context);
  } catch (error) {
    const durationMs = elapsed();
    if (error instanceof Error && error.name === 'TimeoutError') {
      logApiWarning('api.upstream_timeout', { route: ROUTE, traceId: context.traceId, status: 504, durationMs });
      trackModelOutput(ROUTE, 'upstream_timeout', 'error');
      return finalizeApiResponse(jsonError('Upstream timeout', 504, { context }), context);
    }
    trackModelOutput(ROUTE, error instanceof Error ? error.name : 'request_failed', 'error');
    captureAndLogApiError('api.request_failed', error, { route: ROUTE, traceId: context.traceId, status: 500, durationMs });
    return finalizeApiResponse(jsonError('Internal server error', 500, { context }), context);
  }
}
