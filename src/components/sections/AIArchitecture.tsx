'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FadeUp } from '@/components/ui/motion';
import { trackEvent } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

type CategoryKey = 'user' | 'agent' | 'data' | 'model' | 'quality' | 'ops' | 'governance' | 'outcome';

interface Category {
  label: string;
  dot: string;
  text: string;
  bg: string;
}

interface Layer {
  id: string;
  num: string;
  name: string;
  tagline: string;
  category: CategoryKey;
  detail: string;
  tech: string[];
  example: string;
}

const CATEGORIES: Record<CategoryKey, Category> = {
  user:       { label: 'Entry',      dot: 'bg-sky-400',     text: 'text-sky-400',     bg: 'bg-sky-400/10' },
  agent:      { label: 'Agentic',    dot: 'bg-indigo-400',  text: 'text-indigo-400',  bg: 'bg-indigo-400/10' },
  data:       { label: 'Data',       dot: 'bg-teal-400',    text: 'text-teal-400',    bg: 'bg-teal-400/10' },
  model:      { label: 'Model',      dot: 'bg-blue-400',    text: 'text-blue-400',    bg: 'bg-blue-400/10' },
  quality:    { label: 'Quality',    dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-400/10' },
  ops:        { label: 'Ops',        dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  governance: { label: 'Governance', dot: 'bg-orange-400',  text: 'text-orange-400',  bg: 'bg-orange-400/10' },
  outcome:    { label: 'Outcome',    dot: 'bg-green-400',   text: 'text-green-400',   bg: 'bg-green-400/10' },
};

const LAYERS: Layer[] = [
  {
    id: 'user-intent',
    num: '01',
    name: 'User Intent',
    tagline: 'Natural language · API call · UI action',
    category: 'user',
    detail: 'Every request enters as unstructured intent — typed query, voice input, API payload, or workflow trigger. Normalized at ingress before any AI processing begins.',
    tech: ['REST / Streaming API', 'Next.js App Router', 'Input validation', 'Rate limiting'],
    example: 'Portfolio Assistant: user types "Is Prasad a fit for VP of AI?" → validated, rate-checked, forwarded to orchestration.',
  },
  {
    id: 'orchestration',
    num: '02',
    name: 'Agent Orchestration',
    tagline: 'Planner · Specialist agents · Multi-agent loop',
    category: 'agent',
    detail: 'A planner agent decomposes complex tasks into sub-goals, delegates to specialist agents (Analyzer, Researcher, Strategist), and manages the execution graph.',
    tech: ['Multi-Agent API', 'Groq Llama 3.3 70B', 'Task decomposition', 'Agent-to-agent handoff'],
    example: 'Multi-Agent demo: Analyzer → Researcher → Strategist pipeline with shared context and per-step observability.',
  },
  {
    id: 'memory',
    num: '03',
    name: 'Memory & Context',
    tagline: 'Conversation history · Working memory · RAG retrieval',
    category: 'data',
    detail: 'Maintains short-term conversation context and retrieves long-term knowledge via semantic search. Context window managed to stay within token budgets.',
    tech: ['all-MiniLM-L6-v2 embeddings', 'Transformers.js WASM', 'Cosine similarity', 'Context truncation'],
    example: 'RAG Pipeline demo: documents chunked, embedded in-browser via WASM, retrieved by cosine similarity — no server round-trip.',
  },
  {
    id: 'tool-mcp',
    num: '04',
    name: 'Tool / MCP Layer',
    tagline: 'Tool discovery · JSON-RPC execution · Schema validation',
    category: 'agent',
    detail: 'Implements the Model Context Protocol: host discovers available tools via tools/list, LLM selects the right tool, host executes and returns structured results.',
    tech: ['MCP protocol', 'JSON-RPC 2.0', 'Tool schema validation', 'Groq tool calling'],
    example: 'MCP Demo: get_experience, search_skills, calculate_fit_score, get_achievements — all exposed as MCP tools.',
  },
  {
    id: 'model-router',
    num: '05',
    name: 'Model Router',
    tagline: 'Cost · Latency · Quality — pick the right model',
    category: 'model',
    detail: 'Routes each request to the optimal model based on task complexity, required latency, and cost target. Simple tasks go to fast/cheap models; complex reasoning to frontier models.',
    tech: ['LLM Router API', 'Groq Llama 3.1 8B / 70B', 'Complexity scoring', 'Cost-per-token tracking'],
    example: 'LLM Router demo: live routing decisions with cost and latency breakdown per model tier.',
  },
  {
    id: 'adaptive-governance',
    num: '06',
    name: 'Adaptive AI Governance',
    tagline: 'Runtime risk classification · Policy-based routing · Human approval triggers',
    category: 'governance',
    detail: 'Every routed request passes through a runtime risk classifier before a model is selected: standard requests proceed normally, security-sensitive requests are routed to a restricted tier pending human review, regulated-domain requests proceed under policy with a mandatory audit entry, and prompt-injection attempts are blocked outright — every decision logged.',
    tech: ['risk-classifier.ts', 'Runtime risk tiers', 'Policy-based model restriction', 'HITL escalation trigger'],
    example: 'LLM Router demo: every prompt is classified standard / security-sensitive / regulated / blocked before a model is chosen — see the live Runtime Governance panel.',
  },
  {
    id: 'inference',
    num: '07',
    name: 'Inference',
    tagline: 'Server LLM · Browser WASM · WebGPU',
    category: 'model',
    detail: 'Three inference paths: Groq API for server-side LLMs (sub-200ms p99), Transformers.js WASM for browser-local models, Florence-2 on WebGPU for multimodal tasks.',
    tech: ['Groq API', 'Transformers.js v4', 'ONNX Runtime WASM', 'Florence-2 WebGPU'],
    example: 'Quantization demo: FP32 vs INT8 ONNX inference side-by-side with latency and accuracy delta.',
  },
  {
    id: 'eval',
    num: '08',
    name: 'Evaluation',
    tagline: 'LLM-as-Judge · Offline suites · CI regression gate',
    category: 'quality',
    detail: 'Every LLM response is scored by an independent judge model across accuracy, completeness, tone, and hallucination risk. Offline eval suites run in CI — failures block the build.',
    tech: ['eval-engine.ts', 'LLM-as-Judge scoring', 'Vitest eval suite', 'CI quality gate'],
    example: 'Evaluation Showcase demo: live judge scoring + historical score chart + regression pass/fail indicator.',
  },
  {
    id: 'guardrails',
    num: '09',
    name: 'Guardrails',
    tagline: 'Injection detection · Output sanitization · Competitor filter',
    category: 'quality',
    detail: 'All input is scanned for prompt injection patterns before reaching the LLM. All output is sanitized with regex + structural checks before rendering. Competitor mentions are redacted.',
    tech: ['guardrails.ts', 'Injection pattern regex', 'Output sanitizer', 'Competitor blocklist'],
    example: 'Every API route: enforceGuardrails() → checkInput() + sanitizeOutput() — enforced by CLAUDE.md coding rules.',
  },
  {
    id: 'observability',
    num: '10',
    name: 'Observability',
    tagline: 'Trace IDs · Structured logs · Anomaly detection',
    category: 'ops',
    detail: 'Every API request generates a trace ID propagated through the full call stack. Events are emitted as structured JSON with timing, token counts, and route metadata.',
    tech: ['observability.ts', 'startTimer / logAPIEvent', 'Trace propagation', 'Anomaly scoring'],
    example: 'All 9 API routes: logAPIEvent() called at entry and exit — latency + token counts captured per request.',
  },
  {
    id: 'drift',
    num: '11',
    name: 'Drift Monitor',
    tagline: 'Output quality tracking · Statistical drift alerts',
    category: 'ops',
    detail: 'Tracks LLM output quality over time by comparing rolling eval scores against baselines. Statistical drift beyond threshold triggers an alert before users notice degradation.',
    tech: ['drift-monitor.ts', 'trackModelOutput()', 'getDriftSnapshot()', 'Rolling window stats'],
    example: 'Evaluation Showcase: getDriftSnapshot() surfaced in the governance panel alongside live eval scores.',
  },
  {
    id: 'finops',
    num: '12',
    name: 'FinOps',
    tagline: 'Per-route cost · Token budget · Spend gates',
    category: 'ops',
    detail: 'Token cost is computed per API route and per model call. Budget gates prevent runaway inference spend. Cost breakdown is visible in the Enterprise Control Plane demo.',
    tech: ['cost-control.ts', 'Per-route cost tracking', 'Token budget gates', 'Enterprise cost dashboard'],
    example: 'Enterprise Control Plane: $3/MTok input · $15/MTok output · $0.30/MTok cache read — live cost dashboard.',
  },
  {
    id: 'audit',
    num: '13',
    name: 'Audit Trail',
    tagline: 'Immutable logs · Decision records · Trace IDs',
    category: 'governance',
    detail: 'Every agent action, model call, guardrail event, and human approval is logged to an immutable audit trail with timestamps and trace IDs. Satisfies enterprise compliance requirements.',
    tech: ['observability.ts audit events', 'HITL checkpoint log', 'Trace ID linkage', 'Compliance-ready logs'],
    example: 'Multi-Agent HITL: each checkpoint decision logged with agent state snapshot + approver action.',
  },
  {
    id: 'hitl',
    num: '14',
    name: 'Human Approval',
    tagline: 'HITL checkpoints · High-impact gate · Override path',
    category: 'governance',
    detail: 'High-impact agent transitions require explicit human approval before execution continues. The HITL library provides checkpoint utilities, pause/resume, and override logging.',
    tech: ['hitl.ts', 'Approval checkpoints', 'Agent pause/resume', 'Override audit trail'],
    example: 'Multi-Agent demo: Strategist agent pauses before final recommendation — shows HITL gate in the UI.',
  },
  {
    id: 'outcome',
    num: '15',
    name: 'Business Outcome',
    tagline: 'KPIs · Closed-loop feedback · Value measurement',
    category: 'outcome',
    detail: 'The loop closes here: measurable business outcomes feed back into routing decisions, eval baselines, and FinOps budgets for continuous improvement.',
    tech: ['Executive KPI metrics', 'Cost reduction tracking', 'Automation measurement', 'Closed-loop optimization'],
    example: 'Krutrim: 300-seat call center automation · Ola Maps: 35M+ POIs indexed · 70% LLM cost reduction at scale.',
  },
];

// ---------------------------------------------------------------------------
// Layer row component
// ---------------------------------------------------------------------------

function LayerRow({
  layer,
  isActive,
  onToggle,
}: {
  layer: Layer;
  isActive: boolean;
  onToggle: () => void;
}) {
  const cat = CATEGORIES[layer.category];

  return (
    <div className={`rounded-xl border transition-all ${isActive ? 'border-border' : 'border-border/50'}`}>
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-xl"
        aria-expanded={isActive}
        aria-label={`${layer.name}: ${layer.tagline}`}
      >
        {/* Layer number */}
        <span className="text-[10px] font-mono text-muted-foreground/40 w-5 shrink-0 tabular-nums">
          {layer.num}
        </span>

        {/* Category dot */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dot}`} aria-hidden />

        {/* Layer name */}
        <span className="text-sm font-semibold text-foreground leading-tight w-36 sm:w-44 shrink-0">
          {layer.name}
        </span>

        {/* Tagline — hidden on mobile */}
        <span className="text-xs text-muted-foreground flex-1 hidden sm:block truncate">
          {layer.tagline}
        </span>

        {/* Category badge */}
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 hidden sm:inline-flex ${cat.text} ${cat.bg}`}>
          {cat.label}
        </span>

        {/* Expand/collapse chevron */}
        {isActive
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        }
      </button>

      {/* Expanded detail panel */}
      {isActive && (
        <div className="border-t border-border/50 px-4 py-4 space-y-3">
          {/* Mobile-only tagline */}
          <p className="text-xs text-muted-foreground sm:hidden">{layer.tagline}</p>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{layer.detail}</p>

          {/* Tech chips */}
          <div className="flex flex-wrap gap-1.5">
            {layer.tech.map((t) => (
              <span
                key={t}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${cat.bg} ${cat.text}`}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Portfolio example */}
          <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              Portfolio Example
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">{layer.example}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section export
// ---------------------------------------------------------------------------

export function AIArchitecture() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggle = (id: string) => {
    const next = activeId === id ? null : id;
    setActiveId(next);
    if (next) trackEvent('ai_architecture_layer_clicked', { layer: next });
  };

  const categoryEntries = Object.entries(CATEGORIES) as [CategoryKey, Category][];

  return (
    <section id="ai-architecture" className="py-20 bg-background border-t border-border overflow-x-hidden">
      <div className="mx-auto max-w-5xl px-4">

        {/* Header */}
        <FadeUp>
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-brand)' }}>
              Platform Execution Flow
            </p>
            <h2 className="text-3xl font-semibold text-foreground mb-4">
              How a Request Moves Through the Platform
            </h2>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              Every production AI request traverses 14 layers — from user intent through inference,
              governance, and back to measurable business outcomes. Click any layer to see what runs there.
            </p>
          </div>
        </FadeUp>

        {/* Category legend */}
        <FadeUp delay={0.05}>
          <div className="flex flex-wrap gap-2 mb-8">
            {categoryEntries.map(([key, cat]) => (
              <span
                key={key}
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cat.bg} ${cat.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} aria-hidden />
                {cat.label}
              </span>
            ))}
          </div>
        </FadeUp>

        {/* Layer stack */}
        <div className="space-y-1">
          {LAYERS.map((layer, idx) => (
            <FadeUp key={layer.id} delay={Math.min(idx * 0.02, 0.16)}>
              <div>
                <LayerRow
                  layer={layer}
                  isActive={activeId === layer.id}
                  onToggle={() => toggle(layer.id)}
                />
                {/* Arrow connector between layers */}
                {idx < LAYERS.length - 1 && (
                  <div className="flex justify-center my-0.5" aria-hidden>
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                      <path
                        d="M8 0 L8 6 M4 3.5 L8 8 L12 3.5"
                        stroke="var(--accent-brand)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.3"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Bottom callout */}
        <FadeUp delay={0.2}>
          <div className="mt-10 rounded-xl border border-border bg-muted/20 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                All 15 layers are live in this portfolio
              </p>
              <p className="text-sm text-muted-foreground">
                Guardrails, eval, drift monitoring, HITL, and FinOps all run on real requests — not mocked.
                Explore the demos to see each layer in action.
              </p>
            </div>
            <a
              href="/demos"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shrink-0"
              style={{ background: 'var(--accent-brand)' }}
            >
              Explore Demos
            </a>
          </div>
        </FadeUp>

      </div>
    </section>
  );
}
