import { NextRequest, NextResponse } from 'next/server';

const MODELS = [
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Meta', inputCost: 0.05, outputCost: 0.08 },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Meta', inputCost: 0.59, outputCost: 0.79 },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', provider: 'Meta', inputCost: 0.11, outputCost: 0.34 },
  { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', provider: 'Alibaba', inputCost: 0.29, outputCost: 0.59 },
];

export async function POST(req: NextRequest) {
  const { prompt, model: modelId } = await req.json();
  const model = MODELS.find(m => m.id === modelId);
  if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 400 });

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
  });
  const latency = Date.now() - start;
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.error?.message || 'API error' }, { status: 500 });

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = (inputTokens * model.inputCost + outputTokens * model.outputCost) / 1_000_000;

  return NextResponse.json({
    model: model.id,
    modelName: model.name,
    provider: model.provider,
    response: data.choices[0].message.content,
    latency_ms: latency,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: cost,
  });
}
