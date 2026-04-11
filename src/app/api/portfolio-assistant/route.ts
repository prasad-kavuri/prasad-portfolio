import { NextRequest, NextResponse } from 'next/server';
import profile from '@/data/profile.json';
import { rateLimit, detectPromptInjection } from '@/lib/rate-limit';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
  useRAG: boolean;
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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
    if ((await rateLimit(ip)).limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { messages, useRAG } = (await req.json()) as RequestBody;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage && lastUserMessage.content.length > 500) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 });
    }
    if (lastUserMessage && detectPromptInjection(lastUserMessage.content)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Always inject full knowledge base as base context
    const fullContext = profile.knowledgeBase.join('\n\n');

    let systemPrompt = `You are Prasad Kavuri's AI portfolio assistant.
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
                    controller.enqueue(encoder.encode(content));
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
        'X-Retrieved-Docs': JSON.stringify(retrievedDocs),
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
