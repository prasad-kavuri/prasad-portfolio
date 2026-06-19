'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bot, Building2, CheckCircle2, Cuboid, Database, Eye, FileText, GitBranch, KeyRound, Layers, MonitorCheck, Plug, Search, ShieldCheck, Users, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { demos } from '@/data/demos';
import { ThemeToggle } from '@/components/theme-toggle';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const DEMO_ICONS: Record<string, LucideIcon> = {
  'rag-pipeline': Database,
  'llm-router': GitBranch,
  'vector-search': Search,
  'evaluation-showcase': ShieldCheck,
  'multi-agent': Users,
  'mcp-demo': Plug,
  'agent-auth': KeyRound,
  'enterprise-control-plane': Building2,
  'world-generation': Cuboid,
  'browser-native-ai-skill': MonitorCheck,
  'edge-agent-collaboration': Layers,
  'portfolio-assistant': Bot,
  'resume-generator': FileText,
  'multimodal': Eye,
  'quantization': Zap,
};

// ---------------------------------------------------------------------------
// Capability tags for filtering
// ---------------------------------------------------------------------------

const CAPABILITY_FILTERS = [
  { id: 'all', label: 'All Agents' },
  { id: 'agentic', label: 'Agentic / MCP' },
  { id: 'governance', label: 'Governance' },
  { id: 'inference', label: 'Inference' },
  { id: 'browser', label: 'Browser AI' },
  { id: 'enterprise', label: 'Enterprise' },
] as const;

const DEMO_CAPABILITIES: Record<string, string[]> = {
  'evaluation-showcase': ['governance', 'inference'],
  'rag-pipeline': ['inference', 'browser'],
  'llm-router': ['inference', 'enterprise'],
  'vector-search': ['inference', 'browser'],
  'multi-agent': ['agentic', 'governance'],
  'mcp-demo': ['agentic', 'governance'],
  'agent-auth': ['agentic', 'governance'],
  'enterprise-control-plane': ['enterprise', 'governance'],
  'world-generation': ['inference', 'enterprise'],
  'browser-native-ai-skill': ['browser', 'inference'],
  'edge-agent-collaboration': ['agentic', 'browser', 'governance'],
  'portfolio-assistant': ['inference', 'agentic'],
  'resume-generator': ['inference', 'enterprise'],
  'multimodal': ['inference', 'browser'],
  'quantization': ['inference', 'browser'],
};

// Agent tiers — how mature / production-ready
const AGENT_TIERS: Record<string, { tier: string; color: string }> = {
  'evaluation-showcase': { tier: 'Flagship', color: 'bg-indigo-500/20 text-indigo-400' },
  'enterprise-control-plane': { tier: 'Enterprise', color: 'bg-purple-500/20 text-purple-400' },
  'multi-agent': { tier: 'Agentic', color: 'bg-blue-500/20 text-blue-400' },
  'mcp-demo': { tier: 'Protocol', color: 'bg-blue-500/20 text-blue-400' },
  'edge-agent-collaboration': { tier: 'Edge + Cloud', color: 'bg-teal-500/20 text-teal-400' },
  'agent-auth': { tier: 'Identity', color: 'bg-orange-500/20 text-orange-400' },
};

// ---------------------------------------------------------------------------
// Agent card
// ---------------------------------------------------------------------------

function AgentCard({ demo, filter }: {
  demo: typeof demos[0];
  filter: string;
}) {
  const caps = DEMO_CAPABILITIES[demo.id] ?? [];
  const visible = filter === 'all' || caps.includes(filter);
  const Icon = DEMO_ICONS[demo.id] ?? Bot;
  const tier = AGENT_TIERS[demo.id];

  if (!visible) return null;

  return (
    <Link
      href={demo.href}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 hover:border-foreground/20 hover:bg-muted/30 transition-all"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-muted shrink-0">
          <Icon className="w-4 h-4" style={{ color: 'var(--accent-brand)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground leading-tight">{demo.title}</p>
            {tier && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${tier.color}`}>
                {tier.tier}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            <span className="text-[11px] text-green-400 font-medium">Live</span>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3">
        {demo.description.length > 120 ? demo.description.substring(0, 120) + '…' : demo.description}
      </p>

      <div className="flex flex-wrap gap-1 mb-2">
        {caps.map(cap => (
          <span key={cap} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/60 border border-border text-muted-foreground capitalize">
            {cap}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {demo.tags.slice(0, 3).map(tag => (
          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground/70">
            {tag}
          </Badge>
        ))}
        {demo.tags.length > 3 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground/50">
            +{demo.tags.length - 3}
          </Badge>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentMarketplacePage() {
  const [filter, setFilter] = useState<string>('all');

  const visibleCount = demos.filter(d => {
    const caps = DEMO_CAPABILITIES[d.id] ?? [];
    return filter === 'all' || caps.includes(filter);
  }).length;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Sticky header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Portfolio
            </Link>
            <span className="text-border">/</span>
            <span className="text-sm font-semibold text-foreground">Agent Marketplace</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">{demos.length} agents live</Badge>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Hero */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Agent Marketplace
          </p>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {demos.length} Production AI Agents
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            All demos are live, governed by shared platform infrastructure — guardrails, rate limiting, observability, and eval-gated CI. Browse by capability tier or explore the full catalog.
          </p>

          {/* Platform coverage row */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Governance layer', value: 'Shared' },
              { label: 'Rate limiting', value: 'All routes' },
              { label: 'Eval gating', value: 'CI-enforced' },
              { label: 'Audit trail', value: 'Trace IDs' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-xs font-semibold text-green-400">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {CAPABILITY_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === id
                  ? 'text-white'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
              style={filter === id ? { background: 'var(--accent-brand)' } : {}}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-muted-foreground">{visibleCount} showing</span>
        </div>

        {/* Agent grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map(demo => (
            <AgentCard key={demo.id} demo={demo} filter={filter} />
          ))}
        </div>

        {/* Signature callout */}
        <div className="mt-10 rounded-xl border border-border bg-muted/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Signature Agent — Start Here
          </p>
          <p className="text-sm font-semibold text-foreground mb-1">AI Evaluation Showcase</p>
          <p className="text-sm text-muted-foreground mb-4">
            The flagship platform demo: offline eval suites, live drift monitoring, hallucination indicators, and CI-gated quality regression prevention. This is what production AI governance looks like.
          </p>
          <Link
            href="/demos/evaluation-showcase"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'var(--accent-brand)' }}
          >
            Explore Flagship Agent
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation footer */}
        <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-4 text-sm">
          <Link href="/capabilities" className="text-muted-foreground hover:text-foreground transition-colors">
            Platform Capabilities →
          </Link>
          <Link href="/governance" className="text-muted-foreground hover:text-foreground transition-colors">
            Governance Dashboard →
          </Link>
          <Link href="/for-recruiters" className="text-muted-foreground hover:text-foreground transition-colors">
            Recruiter Brief →
          </Link>
          <Link href="/recruiter-dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            Recruiter Dashboard →
          </Link>
        </div>

      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Agent Marketplace — Prasad Kavuri',
            description: `${demos.length} live production AI agents across agentic orchestration, governance, inference, browser AI, and enterprise control — all running on shared platform infrastructure.`,
            url: 'https://www.prasadkavuri.com/agent-marketplace',
            author: { '@type': 'Person', '@id': 'https://www.prasadkavuri.com/#person', name: 'Prasad Kavuri' },
          }).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  );
}
