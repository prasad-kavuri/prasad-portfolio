'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Layers,
  Loader2,
  Lock,
  Server,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { generateClientTraceId, createTracedFetch } from '@/lib/observability';
import { classifyPII } from '@/lib/edge-inference';
import type { RedactionResult } from '@/lib/edge-inference';

const SAMPLE_DOCUMENT = `Customer: Sarah Mitchell
Email: sarah.mitchell@acmecorp.com
Account: ACC-7829-XK
Request: Requesting upgrade to Enterprise tier — Q2 budget approved for $48,000 annual contract. Need implementation timeline by Friday.`;

type Stage = 'idle' | 'edge-running' | 'edge-done' | 'cloud-running' | 'cloud-done';

interface CloudResult {
  summary: string;
  traceId: string;
  tier: 'cloud';
  model: string;
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: 'Edge Agent + Cloud Agent Collaboration',
  description:
    'Privacy-first browser-side PII extraction via Transformers.js ONNX, governed HITL policy gate, and cloud orchestration via Groq.',
  keywords: 'edge-ai, governance, privacy-first-ai, HITL, Transformers.js, Groq',
  url: 'https://www.prasadkavuri.com/demos/edge-agent-collaboration',
  author: {
    '@type': 'Person',
    '@id': 'https://www.prasadkavuri.com/#person',
    name: 'Prasad Kavuri',
    url: 'https://www.prasadkavuri.com',
    sameAs: ['https://www.linkedin.com/in/pkavuri/', 'https://github.com/prasad-kavuri'],
  },
  about: { '@type': 'Thing', name: 'AI Engineering' },
};

export default function EdgeAgentCollaborationPage() {
  const [document, setDocument] = useState(SAMPLE_DOCUMENT);
  const [stage, setStage] = useState<Stage>('idle');
  const [edgeResult, setEdgeResult] = useState<RedactionResult | null>(null);
  const [cloudResult, setCloudResult] = useState<CloudResult | null>(null);
  const [error, setError] = useState<string>('');

  const isEdgeRunning = stage === 'edge-running';
  const isEdgeDone =
    stage === 'edge-done' || stage === 'cloud-running' || stage === 'cloud-done';
  const isCloudRunning = stage === 'cloud-running';
  const isCloudDone = stage === 'cloud-done';
  const isWorking = isEdgeRunning || isCloudRunning;

  const handleRunEdgeAgent = async () => {
    setStage('edge-running');
    setEdgeResult(null);
    setCloudResult(null);
    setError('');
    try {
      const result = await classifyPII(document);
      setEdgeResult(result);
      setStage('edge-done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Edge inference failed');
      setStage('idle');
    }
  };

  const handleApproveAndSend = async () => {
    if (!edgeResult) return;
    setStage('cloud-running');
    setError('');

    const traceId = generateClientTraceId();
    const tracedFetch = createTracedFetch(traceId);
    try {
      const res = await tracedFetch('/api/edge-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sanitizedPayload: edgeResult.redacted,
          approvedByUser: true,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Cloud agent failed');
      }
      const data = (await res.json()) as CloudResult;
      setCloudResult(data);
      setStage('cloud-done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cloud request failed');
      setStage('edge-done');
    }
  };

  const handleReset = () => {
    setStage('idle');
    setEdgeResult(null);
    setCloudResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Sticky header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Edge Agent + Cloud Agent Collaboration
                </h1>
                <Badge className="bg-green-600 text-white hover:bg-green-600">Live</Badge>
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">
                Privacy-first browser-side extraction → governed handoff to cloud orchestration
              </p>
              <p className="mt-1 text-xs italic text-muted-foreground/70">
                Unlike the Browser Native AI Skill demo (Chrome Prompt API), this pipeline uses
                cross-browser Transformers.js ONNX inference — no browser dependency, no server,
                no API key for the edge tier.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Transformers.js', 'ONNX', 'HITL Gate', 'Groq', 'Privacy-First'].map((tag) => (
                <Badge key={tag} variant="outline" className="bg-muted/40">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Architecture diagram */}
        <Card className="border-border bg-card/80 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Three-Tier Architecture
          </p>
          <div className="flex flex-col items-center gap-0 sm:flex-row sm:items-stretch sm:justify-center">
            <div
              className={`flex w-full flex-col items-center rounded-xl border p-4 transition-all sm:w-52 ${
                isEdgeRunning
                  ? 'border-blue-500/60 bg-blue-500/10'
                  : isEdgeDone
                    ? 'border-green-500/40 bg-green-500/10'
                    : 'border-border bg-muted/30'
              }`}
            >
              <Zap
                className={`mb-2 size-6 ${
                  isEdgeRunning
                    ? 'animate-pulse text-blue-400'
                    : isEdgeDone
                      ? 'text-green-400'
                      : 'text-muted-foreground'
                }`}
                aria-hidden="true"
              />
              <p className="text-center text-sm font-semibold">Browser / Edge Agent</p>
              <p className="mt-1 text-center text-[11px] text-muted-foreground">
                BERT NER · Transformers.js WASM
              </p>
              {isEdgeDone && (
                <CheckCircle2 className="mt-2 size-4 text-green-400" aria-hidden="true" />
              )}
            </div>

            <div className="flex items-center justify-center py-4 sm:px-3 sm:py-0">
              <ChevronRight
                className="size-5 rotate-90 text-muted-foreground sm:rotate-0"
                aria-hidden="true"
              />
            </div>

            <div
              className={`flex w-full flex-col items-center rounded-xl border p-4 transition-all sm:w-52 ${
                isEdgeDone && !isCloudDone
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : isCloudDone
                    ? 'border-green-500/40 bg-green-500/10'
                    : 'border-border bg-muted/30'
              }`}
            >
              <Lock
                className={`mb-2 size-6 ${
                  isEdgeDone && !isCloudDone
                    ? 'text-amber-400'
                    : isCloudDone
                      ? 'text-green-400'
                      : 'text-muted-foreground'
                }`}
                aria-hidden="true"
              />
              <p className="text-center text-sm font-semibold">Policy Gate — HITL</p>
              <p className="mt-1 text-center text-[11px] text-muted-foreground">
                User inspects redacted payload
              </p>
              {isCloudDone && (
                <CheckCircle2 className="mt-2 size-4 text-green-400" aria-hidden="true" />
              )}
            </div>

            <div className="flex items-center justify-center py-4 sm:px-3 sm:py-0">
              <ChevronRight
                className="size-5 rotate-90 text-muted-foreground sm:rotate-0"
                aria-hidden="true"
              />
            </div>

            <div
              className={`flex w-full flex-col items-center rounded-xl border p-4 transition-all sm:w-52 ${
                isCloudRunning
                  ? 'border-blue-500/60 bg-blue-500/10'
                  : isCloudDone
                    ? 'border-green-500/40 bg-green-500/10'
                    : 'border-border bg-muted/30'
              }`}
            >
              <Server
                className={`mb-2 size-6 ${
                  isCloudRunning
                    ? 'animate-pulse text-blue-400'
                    : isCloudDone
                      ? 'text-green-400'
                      : 'text-muted-foreground'
                }`}
                aria-hidden="true"
              />
              <p className="text-center text-sm font-semibold">Tool Gateway → Cloud Agent</p>
              <p className="mt-1 text-center text-[11px] text-muted-foreground">
                Groq · Llama 3.3 · Summary
              </p>
              {isCloudDone && (
                <CheckCircle2 className="mt-2 size-4 text-green-400" aria-hidden="true" />
              )}
            </div>
          </div>
        </Card>

        {/* Stage 1: Edge Agent */}
        <Card className="border-border bg-card/80">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-muted/40 font-mono text-xs">
                Tier 1
              </Badge>
              <CardTitle className="text-lg">Edge Agent — Local Inference</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              BERT NER runs in your browser via Transformers.js ONNX. No server call, no API key.
              First-time load may take 30–60 seconds while the model downloads to your device.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="edge-doc" className="mb-2 block text-sm font-medium">
                Document Input (editable)
              </label>
              <textarea
                id="edge-doc"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                rows={6}
                disabled={isWorking}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => void handleRunEdgeAgent()}
                disabled={isWorking || !document.trim()}
                className="min-h-[44px] bg-blue-600 hover:bg-blue-700"
                aria-label="Run edge agent local inference"
              >
                {isEdgeRunning ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Running on-device · No server call
                  </>
                ) : (
                  'Run Edge Agent (Local Inference)'
                )}
              </Button>
              {(isEdgeDone || isCloudDone) && (
                <Button variant="outline" onClick={handleReset} className="min-h-[44px]">
                  Reset
                </Button>
              )}
            </div>

            {isEdgeDone && edgeResult && (
              <div className="space-y-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-green-400">
                    Edge inference complete
                  </span>
                  <Badge variant="outline" className="bg-background/50 font-mono text-xs">
                    tier: edge
                  </Badge>
                  <Badge variant="outline" className="bg-background/50 text-xs">
                    {edgeResult.processingMs}ms
                  </Badge>
                  <Badge variant="outline" className="bg-background/50 font-mono text-xs">
                    {edgeResult.modelId}
                  </Badge>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Redacted Output
                  </p>
                  <pre className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-xs text-foreground">
                    {edgeResult.redacted}
                  </pre>
                </div>
                <div className="flex flex-wrap gap-2">
                  {edgeResult.redactedFields.length > 0 ? (
                    edgeResult.redactedFields.map((field) => (
                      <Badge key={field} variant="secondary" className="font-mono text-xs">
                        [REDACTED:{field}]
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No PII detected</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stage 2: Policy Gate (renders after edge completes) */}
        {isEdgeDone && edgeResult && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-muted/40 font-mono text-xs">
                  Tier 2
                </Badge>
                <CardTitle className="text-lg text-amber-600 dark:text-amber-300">
                  Policy Gate — HITL Checkpoint
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Review what was redacted before approving the cloud handoff. This is the
                governance boundary — explicit, visible, and interactive.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/60 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Fields Redacted at Edge
                  </p>
                  {edgeResult.redactedFields.length > 0 ? (
                    <ul className="space-y-1">
                      {edgeResult.redactedFields.map((field) => (
                        <li key={field} className="flex items-center gap-2 text-sm">
                          <span className="inline-block size-2 rounded-full bg-amber-400" />
                          <span className="font-mono">{field}</span>
                          <ChevronRight className="size-3 text-muted-foreground" aria-hidden="true" />
                          <span className="font-mono text-xs text-muted-foreground">
                            [REDACTED:{field}]
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No PII redacted</p>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-background/60 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    What Cloud Agent Will Receive
                  </p>
                  <pre className="whitespace-pre-wrap text-xs text-foreground">
                    {edgeResult.redacted}
                  </pre>
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="flex items-start gap-2">
                  <Shield className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <span className="font-semibold">Policy:</span> PII fields cannot leave the
                    device boundary. Only business-relevant context proceeds to cloud
                    orchestration.
                  </p>
                </div>
              </div>

              <div>
                <Button
                  onClick={() => void handleApproveAndSend()}
                  disabled={isCloudRunning || isCloudDone}
                  className="min-h-[44px] bg-green-600 hover:bg-green-700"
                  aria-label="Approve and send sanitized payload to cloud agent"
                >
                  {isCloudRunning ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending sanitized payload to cloud agent via Tool Gateway...
                    </>
                  ) : isCloudDone ? (
                    <>
                      <CheckCircle2 className="mr-2 size-4" />
                      Approved &amp; Sent
                    </>
                  ) : (
                    'Approve & Send to Cloud Agent'
                  )}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  This approval checkpoint mirrors enterprise HITL governance patterns.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage 3: Cloud Agent result */}
        {isCloudDone && cloudResult && (
          <Card className="border-border bg-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-muted/40 font-mono text-xs">
                  Tier 3
                </Badge>
                <CardTitle className="text-lg">Cloud Agent — Executive Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm leading-relaxed text-foreground">{cloudResult.summary}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="outline" className="font-mono">
                  tier: cloud
                </Badge>
                <Badge variant="outline" className="font-mono">
                  model: {cloudResult.model}
                </Badge>
                <span>
                  traceId:{' '}
                  <span className="font-mono text-blue-400">{cloudResult.traceId}</span>
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Why This Architecture */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Why This Architecture</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border bg-card/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Lock className="size-4 text-blue-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold">Privacy by Design</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                PII never leaves the browser. Cloud receives only business context. Data residency
                is enforced architecturally, not by policy alone.
              </p>
            </Card>
            <Card className="border-border bg-card/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="size-4 text-amber-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold">Cost Efficiency</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Edge handles extraction at zero inference cost. Cloud handles reasoning,
                consuming only optimized token spend on sanitized, high-signal payloads.
              </p>
            </Card>
            <Card className="border-border bg-card/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="size-4 text-green-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold">Enterprise Governance</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                HITL approval gate is enforced at both UI and API layer. Every handoff is
                auditable by design — the pattern enterprises need for regulated AI workflows.
              </p>
            </Card>
          </div>
        </div>

        {/* Tier comparison table */}
        <Card className="border-border bg-card/70">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-base">Tier Comparison</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-semibold">Dimension</th>
                    <th className="pb-2 pr-4 font-semibold">Edge Tier</th>
                    <th className="pb-2 font-semibold">Cloud Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    ['Inference cost', 'Zero', 'Optimized via LLM Router'],
                    ['Data exposure', 'None (local only)', 'Sanitized payload only'],
                    ['Latency', '~100–500ms WASM', '~1–3s cloud round-trip'],
                    ['Capability', 'Extraction, NER', 'Reasoning, summarization'],
                  ].map(([dim, edge, cloud]) => (
                    <tr key={dim}>
                      <td className="py-2 pr-4 font-medium text-foreground">{dim}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{edge}</td>
                      <td className="py-2 text-muted-foreground">{cloud}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <p className="pb-8 text-center text-xs text-muted-foreground/60">
          This demo uses real browser-side ONNX inference via Transformers.js. It can be connected
          to Gemma-family models, Phi-3, or any ONNX-compatible SLM depending on deployment
          constraints and model licensing.
        </p>
      </div>
    </div>
  );
}
