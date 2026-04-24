'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { getRoutingRecommendation } from '@/lib/llm-routing';

interface ModelResult {
  model: string;
  modelName: string;
  provider: string;
  response: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  error?: string;
  isFallback?: boolean;
}

const MODEL_IDS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'qwen/qwen3-32b',
];

const MODEL_ESTIMATES: Record<string, Omit<ModelResult, 'response'>> = {
  'llama-3.1-8b-instant': {
    model: 'llama-3.1-8b-instant',
    modelName: 'Llama 3.1 8B',
    provider: 'Meta · Groq',
    latency_ms: 280,
    input_tokens: 25,
    output_tokens: 80,
    cost_usd: 0.000008,
  },
  'llama-3.3-70b-versatile': {
    model: 'llama-3.3-70b-versatile',
    modelName: 'Llama 3.3 70B',
    provider: 'Meta · Groq',
    latency_ms: 840,
    input_tokens: 25,
    output_tokens: 120,
    cost_usd: 0.00011,
  },
  'meta-llama/llama-4-scout-17b-16e-instruct': {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    modelName: 'Llama 4 Scout',
    provider: 'Meta · Groq',
    latency_ms: 520,
    input_tokens: 25,
    output_tokens: 95,
    cost_usd: 0.000035,
  },
  'qwen/qwen3-32b': {
    model: 'qwen/qwen3-32b',
    modelName: 'Qwen3 32B',
    provider: 'Alibaba · Groq',
    latency_ms: 680,
    input_tokens: 25,
    output_tokens: 110,
    cost_usd: 0.000072,
  },
};

const MID_TIER_MODELS = [
  {
    id: 'qwen3.6-27b',
    name: 'Qwen 3.6 27B',
    tier: 'mid',
    type: 'dense',
    badges: ['Apache 2.0', '262K ctx', 'Thinking Preservation', 'FP8'],
    description:
      'Dense 27B model with reported 77.2% SWE-bench Verified — flagship coding performance on single-GPU hardware. Native Thinking Preservation retains chain-of-thought across turns.',
    strengths: ['Agentic coding', 'Multi-turn stability', 'Repository-level reasoning', 'Frontend generation'],
    vram: '~16.8GB (Q4)',
    contextWindow: 262144,
    isFallback: false,
  },
  {
    id: 'qwen3-35b-a3b-int4',
    name: 'Qwen3-35B-A3B-int4',
    tier: 'mid',
    type: 'moe',
    badges: ['MoE', 'int4', '3B active', 'Single GPU'],
    description:
      'Mixture-of-experts model tuned for low-latency UI paths where only a small active parameter slice is used per token.',
    strengths: ['Low-latency UI', 'Cost-sensitive routing', 'Local fallback demos'],
    vram: '~21GB (Q4)',
    contextWindow: 32768,
    isFallback: true,
  },
];

const QWEN_MOE_FALLBACK: ModelResult = {
  model: 'qwen-moe-local',
  modelName: 'Qwen 3.6 MoE (int4) — Edge Efficient',
  provider: 'Local vllm · localhost:8000',
  response: '',
  latency_ms: 0,
  input_tokens: 0,
  output_tokens: 0,
  cost_usd: 0,
  isFallback: true,
  error:
    'Qwen MoE local inference unavailable — requires local vllm server. ' +
    'This demo shows the routing architecture; switch to Llama or Mixtral for live output.',
};

const EXAMPLE_PROMPTS = [
  'Explain quantum computing in simple terms',
  'Write a Python fibonacci function',
  'What is the capital of France?',
  'Analyze microservices vs monolith architecture',
  'Translate Hello how are you to Spanish',
];

function createEstimatedResult(modelId: string, prompt: string): ModelResult {
  const estimate = MODEL_ESTIMATES[modelId];
  if (!estimate) {
    return {
      model: modelId,
      modelName: 'Unknown',
      provider: 'Estimated',
      response: 'No estimate available for this model.',
      latency_ms: 0,
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      isFallback: true,
    };
  }

  return {
    ...estimate,
    response: `Estimated comparison for "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}". Live inference runs on the routed model to avoid rate-limit bursts; remaining cards show stable FinOps estimates.`,
    isFallback: true,
  };
}

export default function LLMRouterDemo() {
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<ModelResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedModel, setRecommendedModel] = useState('');
  const [routingRationale, setRoutingRationale] = useState('');
  const [executiveTradeoff, setExecutiveTradeoff] = useState('');
  const [businessValueMode, setBusinessValueMode] = useState(false);
  const [projectedRequests, setProjectedRequests] = useState<number>(10000);

  const handleRunAll = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    const recommendation = getRoutingRecommendation(prompt);
    setRecommendedModel(recommendation.model);
    setRoutingRationale(recommendation.rationale);
    setExecutiveTradeoff(recommendation.executiveTradeoff);
    setResults(null);

    try {
      const recommendedPromise = fetch('/api/llm-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: recommendation.model }),
      })
        .then(async (res) => {
          const data = await res.json() as ModelResult;
          if (!res.ok) {
            return {
              ...createEstimatedResult(recommendation.model, prompt),
              error:
                res.status === 429
                  ? 'Live route temporarily rate-limited. Showing deterministic routing estimate.'
                  : data.error ?? 'Live route unavailable. Showing deterministic routing estimate.',
            };
          }
          return data;
        })
        .catch(() => ({
          ...createEstimatedResult(recommendation.model, prompt),
          error: 'Live route unavailable. Showing deterministic routing estimate.',
        }));

      const qwenPromise = fetch('/api/qwen-moe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
        .then(res => res.json())
        .catch(() => QWEN_MOE_FALLBACK);

      const [recommendedResult, qwenResult] = await Promise.all([recommendedPromise, qwenPromise]);
      const results = [
        recommendedResult,
        ...MODEL_IDS.filter((modelId) => modelId !== recommendation.model).map((modelId) =>
          createEstimatedResult(modelId, prompt)
        ),
        qwenResult as ModelResult,
      ];

      setResults(results);
    } finally {
      setIsLoading(false);
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 500) return 'bg-green-500/20 text-green-400';
    if (latency < 1000) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getSummary = () => {
    if (!results) return null;

    const validResults = results.filter(r => !r.error);
    if (validResults.length === 0) return null;

    const fastest = validResults.reduce((a, b) => (a.latency_ms < b.latency_ms ? a : b));
    const cheapest = validResults.reduce((a, b) => (a.cost_usd < b.cost_usd ? a : b));
    const mostExpensive = validResults.reduce((a, b) => (a.cost_usd > b.cost_usd ? a : b));
    const recommended = validResults.find(r => r.model === recommendedModel);

    const savingsPercent =
      mostExpensive.cost_usd > 0
        ? (((mostExpensive.cost_usd - (recommended?.cost_usd || 0)) / mostExpensive.cost_usd) * 100).toFixed(1)
        : '0';

    return { fastest, cheapest, recommended, savingsPercent };
  };

  const getBusinessProjection = () => {
    if (!summary?.recommended || !results) return null;
    const validResults = results.filter((r) => !r.error);
    const baseline = validResults.reduce((a, b) => (a.cost_usd > b.cost_usd ? a : b));
    const perRequestSavings = Math.max(0, baseline.cost_usd - summary.recommended.cost_usd);
    const projectedSavings = perRequestSavings * projectedRequests;
    const latencyDelta = baseline.latency_ms - summary.recommended.latency_ms;
    return { baseline, perRequestSavings, projectedSavings, latencyDelta };
  };

  const summary = getSummary();
  const businessProjection = getBusinessProjection();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'LLM Router',
    description: 'Real multi-model routing across Llama 3.1 8B, 70B, and Mixtral — see live latency, cost, and quality trade-offs.',
    keywords: 'Groq, Multi-model, Live latency',
    url: 'https://www.prasadkavuri.com/demos/llm-router',
    author: { '@type': 'Person', name: 'Prasad Kavuri', url: 'https://www.prasadkavuri.com' },
    about: { '@type': 'Thing', name: 'AI Engineering' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
          <div>
            <h1 className="text-4xl font-bold">LLM Router Demo</h1>
            <p className="text-muted-foreground mt-2">Real-time multi-model routing — see how intelligent routing achieves cost and latency savings</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            className="w-full p-4 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm h-24 resize-none"
          />

          {/* Example Prompts */}
          <div className="flex flex-wrap gap-2 mt-4">
            {EXAMPLE_PROMPTS.map(example => (
              <button
                key={example}
                onClick={() => setPrompt(example)}
                className="px-3 py-1 bg-muted hover:bg-muted/80 border border-border rounded-full text-sm text-muted-foreground transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Run Button */}
        <div className="mb-8">
          <Button
            onClick={handleRunAll}
            disabled={!prompt.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Route & Run All Models
          </Button>
        </div>

        <Card className="mb-8 border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            FinOps Routing Signal
          </h2>
          <p className="text-sm text-muted-foreground mb-2">
            Per-model cost values shown below are illustrative estimates from the configured token-rate table in `/api/llm-router`, used for relative comparison only.
          </p>
          <p className="text-sm text-muted-foreground">
            Route intent: prefer lower-cost low-latency tiers for simple queries, then escalate to higher-capability models only when prompt complexity requires it.
          </p>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={businessValueMode}
              onChange={(e) => setBusinessValueMode(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Business Value Mode</span>
          </label>
        </Card>

        <Card className="mb-8 border-border bg-card p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Mid Tier Model Cards
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Mid-tier routes balance coding quality, latency, and single-GPU deployment constraints.
              </p>
            </div>
            <Badge variant="outline" className="w-fit bg-muted/40">reported benchmarks</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {MID_TIER_MODELS.map((model) => (
              <div key={model.id} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{model.name}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {model.tier} tier · {model.type}
                    </p>
                  </div>
                  <Badge className={model.type === 'dense' ? 'border-0 bg-blue-500/20 text-blue-300' : 'border-0 bg-purple-500/20 text-purple-300'}>
                    {model.type}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {model.badges.map((badge) => (
                    <Badge key={badge} variant="outline" className="bg-background/60 text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{model.description}</p>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <p><span className="font-medium text-foreground">VRAM:</span> {model.vram}</p>
                  <p><span className="font-medium text-foreground">Context:</span> {model.contextWindow.toLocaleString()} tokens</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {model.strengths.map((strength) => (
                    <span key={strength} className="rounded-md bg-background px-2 py-1 text-xs text-muted-foreground">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
            <p className="font-medium text-foreground">Qwen3.6-27B Routing Rule</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              task.type === &quot;agent&quot; || task.complexity === &quot;medium-high&quot;
            </p>
            <p className="mt-2 text-muted-foreground">
              Dense architecture + Thinking Preservation = stable multi-turn reasoning without MoE routing overhead.
            </p>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Dense vs MoE</th>
                  <th className="px-3 py-2">27B Dense</th>
                  <th className="px-3 py-2">35B-A3B MoE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                {[
                  ['Active params', '27B', '3B'],
                  ['SWE-bench', '77.2%', '~72%'],
                  ['Inference speed', 'Moderate', 'Fast'],
                  ['VRAM (Q4)', '~16.8GB', '~21GB'],
                  ['Best for', 'Agent loops', 'Low-latency UI'],
                ].map(([label, dense, moe]) => (
                  <tr key={label}>
                    <td className="px-3 py-2 font-medium text-foreground">{label}</td>
                    <td className="px-3 py-2">{dense}</td>
                    <td className="px-3 py-2">{moe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Results Grid */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[...MODEL_IDS, 'qwen-moe-local'].map(modelId => (
              <Card key={modelId} className="bg-card border-border p-6 animate-pulse">
                <div className="h-8 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded" />
              </Card>
            ))}
          </div>
        )}

        {results && (
          <div className="mb-8">
            {summary && businessProjection && (
              <Card className="mb-6 border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Routing Economics Snapshot
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Routed Model</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {summary.recommended?.modelName ?? "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Estimated Cost / Request</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      ${summary.recommended?.cost_usd.toFixed(6) ?? "0.000000"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Premium Baseline</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      ${businessProjection.baseline.cost_usd.toFixed(6)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Savings vs Baseline</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-400">
                      ${businessProjection.perRequestSavings.toFixed(6)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              {results.map(result => (
                <Card
                  key={result.model}
                  className="bg-card border-border p-6 flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{result.modelName}</h3>
                      <p className="text-xs text-muted-foreground">{result.provider}</p>
                    </div>
                    {result.model === recommendedModel && !result.error && (
                      <Badge className="bg-green-500/20 text-green-400 border-0">Recommended</Badge>
                    )}
                  </div>

                  {result.isFallback && result.model === 'qwen-moe-local' ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">35B params / ~3B active</Badge>
                        <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">MoE</Badge>
                        <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">int4</Badge>
                        <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">Single GPU</Badge>
                      </div>
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                        {result.error}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Intel AutoRound int4 quantization via vllm. MoE = only ~3B params activated per token,
                        delivering 30B+ reasoning at 3B inference cost.
                      </p>
                    </div>
                  ) : result.isFallback ? (
                    <div className="flex flex-col gap-3">
                      <Badge className="w-fit border-0 bg-blue-500/20 text-blue-300 text-xs">Estimated comparison</Badge>
                      {result.error && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                          {result.error}
                        </div>
                      )}
                      <div className="mb-1">
                        <Badge className={`${getLatencyColor(result.latency_ms)} border-0 text-xs font-mono`}>
                          ~{result.latency_ms}ms
                        </Badge>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <div>
                          Input: ~{result.input_tokens} | Output: ~{result.output_tokens}
                        </div>
                        <div className="font-mono text-foreground">
                          ~${result.cost_usd.toFixed(6)}
                        </div>
                      </div>
                      <div className="rounded bg-background p-3 text-sm text-muted-foreground font-mono">
                        {result.response}
                      </div>
                    </div>
                  ) : result.error ? (
                    <div className="text-sm text-red-400">Error: {result.error}</div>
                  ) : (
                    <>
                      {/* Metadata badges for live Qwen MoE inference */}
                      {result.model === 'qwen-moe-local' && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">35B params / ~3B active</Badge>
                          <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">MoE</Badge>
                          <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">int4</Badge>
                          <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">Single GPU</Badge>
                        </div>
                      )}

                      {/* Latency */}
                      <div className="mb-4">
                        <Badge className={`${getLatencyColor(result.latency_ms)} border-0 text-xs font-mono`}>
                          {result.latency_ms}ms
                        </Badge>
                      </div>

                      {/* Tokens & Cost */}
                      <div className="text-xs space-y-1 mb-4 text-muted-foreground">
                        <div>
                          Input: {result.input_tokens} | Output: {result.output_tokens}
                        </div>
                        <div className="font-mono text-foreground">
                          {result.model === 'qwen-moe-local' ? '$0.000000 (local)' : `$${result.cost_usd.toFixed(6)}`}
                        </div>
                      </div>

                      {/* Response */}
                      <div className="flex-1 overflow-hidden">
                        <div className="max-h-[150px] overflow-y-auto bg-background rounded p-3 text-sm text-muted-foreground font-mono">
                          {result.response}
                        </div>
                      </div>

                      {result.model === 'qwen-moe-local' && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Intel AutoRound int4 quantization via vllm. MoE = only ~3B params activated per token,
                          delivering 30B+ reasoning at 3B inference cost.
                        </p>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </div>

            {/* Summary */}
            {summary && (
              <Card className="bg-card border-border p-6">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Fastest</p>
                    <p className="font-semibold text-lg mt-1 text-foreground">{summary.fastest?.modelName}</p>
                    <p className="text-sm text-muted-foreground">{summary.fastest?.latency_ms}ms</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Cheapest</p>
                    <p className="font-semibold text-lg mt-1 text-foreground">{summary.cheapest?.modelName}</p>
                    <p className="text-sm text-muted-foreground">${summary.cheapest?.cost_usd.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Recommended</p>
                    <p className="font-semibold text-lg mt-1 text-foreground">{summary.recommended?.modelName}</p>
                    <p className="text-sm text-muted-foreground">${summary.recommended?.cost_usd.toFixed(6)}</p>
                  </div>
                  <div className="bg-green-500/10 rounded p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Cost Savings</p>
                    <p className="font-semibold text-2xl mt-1 text-green-400">{summary.savingsPercent}%</p>
                  </div>
                </div>
                {summary.recommended && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                    <p className="font-medium text-foreground">Why this route was recommended</p>
                    <p className="mt-1 text-muted-foreground">{routingRationale}</p>
                    <p className="mt-1 text-muted-foreground">{executiveTradeoff}</p>
                  </div>
                )}
                {businessValueMode && businessProjection && (
                  <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">Business Value Projection</p>
                      <div className="flex items-center gap-2">
                        {[10000, 50000, 100000].map((volume) => (
                          <button
                            key={volume}
                            onClick={() => setProjectedRequests(volume)}
                            className={`px-2 py-1 rounded text-xs border ${
                              projectedRequests === volume
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            {volume.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                      Illustrative estimate at {projectedRequests.toLocaleString()} requests: routing to {summary.recommended?.modelName ?? 'recommended tier'} instead of {businessProjection.baseline.modelName} saves about <span className="font-medium text-foreground">${businessProjection.projectedSavings.toFixed(2)}</span> with a per-request delta of ${businessProjection.perRequestSavings.toFixed(6)}.
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Latency difference versus highest-cost tier: {businessProjection.latencyDelta >= 0 ? '+' : ''}{businessProjection.latencyDelta}ms.
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
