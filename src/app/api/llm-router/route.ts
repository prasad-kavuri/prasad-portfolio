import { NextRequest, NextResponse } from 'next/server';
import { detectPromptInjection, sanitizeLLMOutput } from '@/lib/rate-limit';
import { enforceRateLimit, jsonError, readJsonObject } from '@/lib/api';

const MODELS = [
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Meta', inputCost: 0.05, outputCost: 0.08 },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Meta', inputCost: 0.59, outputCost: 0.79 },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', provider: 'Meta', inputCost: 0.11, outputCost: 0.34 },
  { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', provider: 'Alibaba', inputCost: 0.29, outputCost: 0.59 },
];

export async function POST(req: NextRequest) {
  const rateLimited = await enforceRateLimit(req, 'unknown');
  if (rateLimited) return rateLimited;

  const body = await readJsonObject(req);
  if (!body.ok) return body.response;

  const { prompt, model: modelId } = body.data;

  if (!prompt || typeof prompt !== 'string') {
    return jsonError('Prompt is required', 400);
  }
  if (prompt.length > 500) {
    return jsonError('Input too long', 400);
  }
  if (detectPromptInjection(prompt)) {
    return jsonError('Invalid input', 400);
  }

  const model = MODELS.find(m => m.id === modelId);
  if (!model) return jsonError('Model not found', 400);

  if (!process.env.GROQ_API_KEY) {
    return jsonError('GROQ_API_KEY not configured', 500);
  }

  try {
    const start = Date.now();
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const latency = Date.now() - start;
    const data = await res.json() as {
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      choices?: Array<{ message?: { content?: string } }>;
    };
    if (!res.ok) return jsonError('Failed to call Groq API', 500);

    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const cost = (inputTokens * model.inputCost + outputTokens * model.outputCost) / 1_000_000;

    return NextResponse.json({
      model: model.id,
      modelName: model.name,
      provider: model.provider,
      response: sanitizeLLMOutput(data.choices?.[0]?.message?.content ?? ''),
      latency_ms: latency,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: cost,
    });
  } catch {
    return jsonError('Failed to call Groq API', 500);
  }
}
