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
}

const MODEL_IDS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'qwen/qwen3-32b',
];

const EXAMPLE_PROMPTS = [
  'Explain quantum computing in simple terms',
  'Write a Python fibonacci function',
  'What is the capital of France?',
  'Analyze microservices vs monolith architecture',
  'Translate Hello how are you to Spanish',
];

export default function LLMRouterDemo() {
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<ModelResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedModel, setRecommendedModel] = useState('');
  const [routingRationale, setRoutingRationale] = useState('');
  const [executiveTradeoff, setExecutiveTradeoff] = useState('');

  const handleRunAll = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    const recommendation = getRoutingRecommendation(prompt);
    setRecommendedModel(recommendation.model);
    setRoutingRationale(recommendation.rationale);
    setExecutiveTradeoff(recommendation.executiveTradeoff);
    setResults(null);

    try {
      const promises = MODEL_IDS.map(modelId =>
        fetch('/api/llm-router', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model: modelId }),
        })
          .then(res => res.json())
          .catch(error => ({ error: error.message }))
      );

      const settledResults = await Promise.allSettled(promises);
      const results = settledResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return {
          model: MODEL_IDS[index],
          modelName: 'Unknown',
          provider: 'Unknown',
          error: 'Request failed',
          response: '',
          latency_ms: 0,
          input_tokens: 0,
          output_tokens: 0,
          cost_usd: 0,
        };
      });

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

  const summary = getSummary();

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
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
        </Card>

        {/* Results Grid */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {MODEL_IDS.map(modelId => (
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

                  {result.error ? (
                    <div className="text-sm text-red-400">Error: {result.error}</div>
                  ) : (
                    <>
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
                          ${result.cost_usd.toFixed(6)}
                        </div>
                      </div>

                      {/* Response */}
                      <div className="flex-1 overflow-hidden">
                        <div className="max-h-[150px] overflow-y-auto bg-background rounded p-3 text-sm text-muted-foreground font-mono">
                          {result.response}
                        </div>
                      </div>
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
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
