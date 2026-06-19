"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, Network, Plug, Server, Terminal, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: string;
  duration_ms: number;
}

interface MCPResponse {
  query: string;
  toolsDiscovered: number;
  toolCallLog: ToolCall[];
  finalAnswer: string;
  totalDuration_ms: number;
}

// ---------------------------------------------------------------------------
// Protocol flow visualizer
// ---------------------------------------------------------------------------

const PROTOCOL_STEPS = [
  {
    id: 'discover',
    label: 'Discover',
    icon: Network,
    desc: 'Client → Server: tools/list request',
    payload: '{"jsonrpc":"2.0","method":"tools/list","id":1}',
  },
  {
    id: 'select',
    label: 'Select',
    icon: Zap,
    desc: 'LLM selects tool(s) from schema',
    payload: '{"tool":"get_experience","reason":"query requires work history"}',
  },
  {
    id: 'execute',
    label: 'Execute',
    icon: Terminal,
    desc: 'Server runs tool · returns result',
    payload: '{"jsonrpc":"2.0","result":{"content":[{"type":"text","text":"..."}]},"id":2}',
  },
  {
    id: 'synthesize',
    label: 'Synthesize',
    icon: Server,
    desc: 'LLM forms final answer from results',
    payload: '{"finalAnswer":"Based on the tools called, Prasad is a strong fit..."}',
  },
] as const;

function ProtocolFlowCard({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 items-start sm:items-center mb-6 rounded-xl border border-border bg-muted/20 p-4">
      {PROTOCOL_STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === activeStep;
        const isDone = idx < activeStep;
        return (
          <div key={step.id} className="flex sm:flex-col items-center sm:flex-1 gap-3 sm:gap-1">
            <div className={`flex items-center justify-center rounded-lg w-9 h-9 shrink-0 transition-all duration-300 ${
              isActive ? 'text-white shadow-md' :
              isDone   ? 'bg-green-500/20 text-green-400' :
                         'bg-muted text-muted-foreground'
            }`} style={isActive ? { background: 'var(--accent-brand)' } : {}}>
              {isDone
                ? <CheckCircle2 className="w-4 h-4" />
                : <Icon className="w-4 h-4" />
              }
            </div>
            <div className="flex-1 sm:text-center">
              <p className={`text-xs font-semibold ${isActive ? 'text-foreground' : isDone ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                {step.label}
              </p>
              <p className="text-[10px] text-muted-foreground/60 hidden sm:block leading-tight mt-0.5">{step.desc}</p>
            </div>
            {idx < PROTOCOL_STEPS.length - 1 && (
              <ChevronRight className="w-3 h-3 text-border shrink-0 sm:hidden" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool execution card
// ---------------------------------------------------------------------------

function ToolCard({ call, expanded, onToggle }: {
  call: ToolCall;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <code className="text-sm font-mono" style={{ color: 'var(--accent-brand)' }}>{call.tool}</code>
        <span className="ml-auto text-xs text-muted-foreground font-mono">{call.duration_ms}ms</span>
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Input args</p>
            <pre className="text-xs font-mono bg-muted/40 rounded p-2 overflow-auto max-h-24 text-foreground/80">
              {JSON.stringify(call.args, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Result (truncated)</p>
            <pre className="text-xs font-mono bg-muted/40 rounded p-2 overflow-auto max-h-32 text-foreground/80">
              {call.result.substring(0, 300)}{call.result.length > 300 ? '…' : ''}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const EXAMPLE_QUERIES = [
  "Is Prasad a good fit for VP of AI Engineering?",
  "What are Prasad's cloud infrastructure skills?",
  "Show Krutrim achievements and metrics",
  "Compare Prasad's skills to a CTO role requiring: strategy, AI, cloud, leadership",
];

const TOOLS_REGISTRY = [
  { name: 'get_experience', desc: 'Retrieves work history, roles, and tenure context', schema: '(query?: string) → ExperienceRecord[]' },
  { name: 'search_skills', desc: 'Semantic search over skills and technology stack', schema: '(skill: string, minLevel?: number) → SkillRecord[]' },
  { name: 'calculate_fit_score', desc: 'Scores candidate fit against a role description', schema: '(role: string, requirements: string[]) → FitScore' },
  { name: 'get_achievements', desc: 'Returns quantified business outcomes by context', schema: '(context?: string) → Achievement[]' },
];

export default function MCPDemoPage() {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<MCPResponse | null>(null);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [activeProtocolStep, setActiveProtocolStep] = useState(0);

  const handleRunDemo = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    setMcpError(null);
    setExpandedIdx(null);
    setActiveProtocolStep(0);

    const stepTimers = [
      setTimeout(() => setActiveProtocolStep(1), 600),
      setTimeout(() => setActiveProtocolStep(2), 1200),
      setTimeout(() => setActiveProtocolStep(3), 1800),
    ];

    try {
      const res = await fetch("/api/mcp-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("Failed to run MCP demo");
      const data = (await res.json()) as MCPResponse;
      setResponse(data);
      setActiveProtocolStep(3);
    } catch (error) {
      console.error("[mcp-demo] fetch error:", error);
      setMcpError(error instanceof Error ? error.message : "Failed to run demo");
      setActiveProtocolStep(0);
    } finally {
      setLoading(false);
      stepTimers.forEach(clearTimeout);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'MCP Tool Demo',
    description: "Model Context Protocol — watch an LLM discover and call tools to answer questions about Prasad's background.",
    keywords: 'MCP, Tool Use, Groq API, JSON-RPC',
    url: 'https://www.prasadkavuri.com/demos/mcp-demo',
    author: { '@type': 'Person', '@id': 'https://www.prasadkavuri.com/#person', name: 'Prasad Kavuri', url: 'https://www.prasadkavuri.com', sameAs: ['https://www.linkedin.com/in/pkavuri/', 'https://github.com/prasad-kavuri'] },
    about: { '@type': 'Thing', name: 'AI Engineering' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Sticky header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/demos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              All Demos
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">MCP</Badge>
            <Badge variant="secondary" className="text-[10px]">JSON-RPC 2.0</Badge>
            <Badge variant="secondary" className="text-[10px]">Groq</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-muted">
              <Plug className="w-5 h-5" style={{ color: 'var(--accent-brand)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MCP Tool Demo</h1>
              <p className="text-sm text-muted-foreground">Model Context Protocol — real-time tool discovery, selection, and execution</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mt-3">
            MCP standardizes how AI agents discover and call tools. Watch the full JSON-RPC 2.0 lifecycle: tool schema negotiation, LLM selection, server-side execution, and answer synthesis — all transparent and traceable.
          </p>
        </div>

        {/* Protocol overview stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-card border-border p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Tools Available</p>
            <p className="text-2xl font-bold">4</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed">get_experience · search_skills · calculate_fit_score · get_achievements</p>
          </Card>
          <Card className="bg-card border-border p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Transport</p>
            <p className="text-2xl font-bold">HTTP</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">JSON-RPC 2.0 over HTTPS</p>
          </Card>
          <Card className="bg-card border-border p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Standard</p>
            <p className="text-2xl font-bold">MCP</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">Linux Foundation · open spec</p>
          </Card>
        </div>

        {/* Protocol flow */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Protocol Lifecycle</p>
          <ProtocolFlowCard activeStep={loading ? activeProtocolStep : (response ? 3 : 0)} />
        </div>

        {/* Tool registry */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Tool Registry</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {TOOLS_REGISTRY.map(tool => (
              <div key={tool.name} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start gap-2">
                  <Terminal className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--accent-brand)' }} />
                  <div className="min-w-0">
                    <code className="text-xs font-mono font-semibold text-foreground">{tool.name}</code>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{tool.desc}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">{tool.schema}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Query input */}
        <Card className="bg-card border-border p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Run a Query</p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., Is Prasad a good fit for VP of AI Engineering?"
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 resize-none transition-all"
            rows={2}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleRunDemo(); }}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => setQuery(q)}
                className="px-2.5 py-1 bg-muted/60 hover:bg-muted border border-border rounded-md text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {q.substring(0, 34)}…
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={handleRunDemo}
              disabled={loading || !query.trim()}
              className="text-white disabled:opacity-50"
              style={{ background: 'var(--accent-brand)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calling MCP tools…
                </>
              ) : (
                <>
                  <Plug className="w-4 h-4 mr-2" />
                  Run with MCP
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">Ctrl+Enter to run</p>
          </div>
        </Card>

        {/* Error banner */}
        {mcpError && (
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 px-4 py-3 text-sm mb-6">
            ⚠️ Live model unavailable — Groq API may be rate-limited. The protocol visualization and tool registry above remain fully functional.{' '}
            <Link href="/governance" className="underline hover:no-underline">View platform status →</Link>
          </div>
        )}

        {/* Results */}
        {response && (
          <div className="space-y-6 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Tool Execution Log — {response.toolCallLog.length} tool{response.toolCallLog.length !== 1 ? 's' : ''} called
              </p>
              {response.toolCallLog.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  No tools were called for this query
                </div>
              ) : (
                <div className="space-y-2">
                  {response.toolCallLog.map((call, idx) => (
                    <ToolCard
                      key={idx}
                      call={call}
                      expanded={expandedIdx === idx}
                      onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Synthesized Answer</p>
              <Card className="bg-card border-border p-5">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{response.finalAnswer}</p>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{response.toolCallLog.length} tools · {response.toolsDiscovered} discovered</span>
                  <span className="font-mono">{response.totalDuration_ms}ms total</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Business context */}
        <Card className="bg-card border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Why MCP matters for enterprise AI</p>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1">Standardization</p>
              <p>One protocol for all tool integrations — no bespoke adapters per agent or model provider.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Auditability</p>
              <p>Every tool call is a traceable JSON-RPC message with explicit input/output — no black-box side effects.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Governance</p>
              <p>Tool schemas enforce capability contracts. Rate limiting and guardrails layer on top of the protocol.</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50">
            <Link href="/agent-marketplace" className="inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: 'var(--accent-brand)' }}>
              Browse all MCP-enabled demos in the Agent Marketplace →
            </Link>
          </div>
        </Card>

      </div>
    </div>
  );
}
