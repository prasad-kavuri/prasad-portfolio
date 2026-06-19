'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Bot, Building2, CheckCircle2, Cuboid, Database,
  Eye, FileText, GitBranch, KeyRound, Layers, MonitorCheck,
  Plug, Search, ShieldCheck, Users, Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { demos } from '@/data/demos';
import { trackEvent } from '@/lib/analytics';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEMO_ICONS: Record<string, LucideIcon> = {
  'evaluation-showcase': ShieldCheck,
  'rag-pipeline': Database,
  'llm-router': GitBranch,
  'vector-search': Search,
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

// Execution model label per demo
const EXEC_MODEL: Record<string, { label: string; color: string }> = {
  'rag-pipeline':              { label: 'Browser WASM',  color: 'bg-teal-500/15 text-teal-400' },
  'llm-router':                { label: 'Server API',    color: 'bg-blue-500/15 text-blue-400' },
  'vector-search':             { label: 'Browser WASM',  color: 'bg-teal-500/15 text-teal-400' },
  'evaluation-showcase':       { label: 'Server API',    color: 'bg-blue-500/15 text-blue-400' },
  'multi-agent':               { label: 'Server API',    color: 'bg-blue-500/15 text-blue-400' },
  'mcp-demo':                  { label: 'Server API',    color: 'bg-blue-500/15 text-blue-400' },
  'portfolio-assistant':       { label: 'Server API',    color: 'bg-blue-500/15 text-blue-400' },
  'resume-generator':          { label: 'Server API',    color: 'bg-blue-500/15 text-blue-400' },
  'multimodal':                { label: 'WebGPU',        color: 'bg-purple-500/15 text-purple-400' },
  'quantization':              { label: 'Browser ONNX',  color: 'bg-teal-500/15 text-teal-400' },
  'enterprise-control-plane':  { label: 'Server API',    color: 'bg-blue-500/15 text-blue-400' },
  'browser-native-ai-skill':   { label: 'On-Device AI',  color: 'bg-green-500/15 text-green-400' },
  'edge-agent-collaboration':  { label: 'Edge + Cloud',  color: 'bg-orange-500/15 text-orange-400' },
  'agent-auth':                { label: 'Server API',    color: 'bg-blue-500/15 text-blue-400' },
  'world-generation':          { label: 'Three.js + API',color: 'bg-indigo-500/15 text-indigo-400' },
};

const GROUPS = [
  {
    id: 'core',
    label: 'Core AI Infrastructure',
    description: 'Foundation systems — quality, retrieval, routing, and governance',
    ids: ['evaluation-showcase', 'rag-pipeline', 'llm-router', 'vector-search', 'browser-native-ai-skill'],
  },
  {
    id: 'agentic',
    label: 'Agentic Systems',
    description: 'Autonomous agents, tool-use orchestration, and enterprise control',
    ids: ['multi-agent', 'mcp-demo', 'agent-auth', 'edge-agent-collaboration', 'enterprise-control-plane', 'world-generation'],
  },
  {
    id: 'apps',
    label: 'AI Applications',
    description: 'Production AI experiences across modalities',
    ids: ['portfolio-assistant', 'resume-generator', 'multimodal', 'quantization'],
  },
] as const;

type GroupId = typeof GROUPS[number]['id'];

const FILTERS = [
  { id: 'all' as const,     label: 'All Modules' },
  { id: 'core' as const,    label: 'Core AI' },
  { id: 'agentic' as const, label: 'Agentic' },
  { id: 'apps' as const,    label: 'Applications' },
];

// ---------------------------------------------------------------------------
// Module card
// ---------------------------------------------------------------------------

function ModuleCard({ demo, featured = false }: { demo: typeof demos[0]; featured?: boolean }) {
  const Icon = DEMO_ICONS[demo.id] ?? Bot;
  const exec = EXEC_MODEL[demo.id];

  return (
    <Link
      href={demo.href}
      onClick={() => trackEvent('demo_opened', { demo: demo.id })}
      className={`group flex flex-col rounded-xl border bg-card transition-all hover:shadow-md ${
        featured
          ? 'border-2 col-span-full'
          : 'border-border hover:border-foreground/20'
      }`}
      style={featured ? { borderColor: 'var(--accent-brand)' } : {}}
    >
      <div className="flex flex-col flex-1 p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-muted shrink-0">
            <Icon className="w-5 h-5" style={{ color: 'var(--accent-brand)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              {featured && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400">
                  Signature System
                </span>
              )}
              <h3 className="text-sm font-semibold text-foreground leading-tight">{demo.title}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                <span className="text-[11px] text-green-400 font-medium">Live</span>
              </div>
              {exec && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${exec.color}`}>
                  {exec.label}
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Business impact — the "why this matters" hook */}
        <p className="text-xs font-medium mb-3 leading-relaxed" style={{ color: 'var(--accent-brand)' }}>
          {demo.businessImpact}
        </p>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
          {demo.description}
        </p>

        {/* Business outcome callout */}
        {demo.businessOutcome && (
          <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2.5 mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              What this proves
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">{demo.businessOutcome}</p>
          </div>
        )}

        {/* Tech tags */}
        <div className="flex flex-wrap gap-1">
          {demo.tags.slice(0, 4).map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground/70">
              {tag}
            </Badge>
          ))}
          {demo.tags.length > 4 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground/50">
              +{demo.tags.length - 4}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export function DemosGallery() {
  const [activeGroup, setActiveGroup] = useState<'all' | GroupId>('all');

  const signature = demos.find(d => d.id === 'evaluation-showcase');
  const filteredGroups = GROUPS.filter(g => activeGroup === 'all' || g.id === activeGroup);
  const visibleCount = activeGroup === 'all'
    ? demos.length
    : GROUPS.find(g => g.id === activeGroup)?.ids.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Platform stats strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-10">
        {[
          { label: 'Governance layer', value: 'Shared' },
          { label: 'Rate limiting',    value: 'All routes' },
          { label: 'Eval gating',      value: 'CI-enforced' },
          { label: 'Audit trail',      value: 'Trace IDs' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-xs font-semibold text-green-400">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveGroup(id)}
            aria-pressed={activeGroup === id}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeGroup === id
                ? 'text-white'
                : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
            style={activeGroup === id ? { background: 'var(--accent-brand)' } : {}}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">{visibleCount} modules</span>
      </div>

      {/* Signature module — always shown */}
      {signature && (activeGroup === 'all' || activeGroup === 'core') && (
        <div className="mb-10">
          <ModuleCard demo={signature} featured />
        </div>
      )}

      {/* Groups */}
      {filteredGroups.map(group => {
        const groupDemos = demos.filter(d =>
          (group.ids as readonly string[]).includes(d.id) && d.id !== 'evaluation-showcase'
        );
        if (groupDemos.length === 0) return null;

        return (
          <div key={group.id} className="mb-12">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent-brand)' }}>
                {group.label}
              </p>
              <p className="text-xs text-muted-foreground">{group.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groupDemos.map(demo => (
                <ModuleCard key={demo.id} demo={demo} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Bottom CTA */}
      <div className="mt-4 pt-8 border-t border-border flex flex-wrap gap-4 text-sm">
        <Link href="/agent-marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
          Agent Marketplace →
        </Link>
        <Link href="/governance" className="text-muted-foreground hover:text-foreground transition-colors">
          Governance Dashboard →
        </Link>
        <Link href="/capabilities" className="text-muted-foreground hover:text-foreground transition-colors">
          Platform Capabilities →
        </Link>
      </div>
    </div>
  );
}
