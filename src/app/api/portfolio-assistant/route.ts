import { NextRequest, NextResponse } from 'next/server';
import profile from '@/data/profile.json';
import { detectPromptInjection, sanitizeLLMOutput } from '@/lib/rate-limit';
import { enforceRateLimit, jsonError, readJsonObject } from '@/lib/api';

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

function validateMessages(value: unknown): Message[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) return null;

  const messages: Message[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    if (content.length > 1000) return null;
    messages.push({ role, content });
  }

  return messages;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await enforceRateLimit(req);
    if (rateLimited) return rateLimited;

    const body = await readJsonObject(req);
    if (!body.ok) return body.response;

    const messages = validateMessages(body.data.messages);
    if (!messages) {
      return jsonError('Messages are required', 400);
    }

    if (body.data.useRAG !== undefined && typeof body.data.useRAG !== 'boolean') {
      return jsonError('Invalid input', 400);
    }
    const useRAG = body.data.useRAG === true;

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage && lastUserMessage.content.length > 500) {
      return jsonError('Input too long', 400);
    }
    if (lastUserMessage && detectPromptInjection(lastUserMessage.content)) {
      return jsonError('Invalid input', 400);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return jsonError('GROQ_API_KEY not configured', 500);
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

    // Prepare messages for Groq API
    const groqMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
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
      const error = await response.text();
      console.error('Groq API error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from Groq API' },
        { status: 500 }
      );
    }

    // Create a readable stream for streaming response
    const encoder = new TextEncoder();
    let buffer = '';

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
                    controller.enqueue(encoder.encode(sanitizeLLMOutput(content)));
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
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Retrieved-Docs': JSON.stringify(retrievedDocs.map(({ id, title }) => ({ id, title }))),
      },
    });
  } catch (error) {
    console.error('Portfolio assistant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
