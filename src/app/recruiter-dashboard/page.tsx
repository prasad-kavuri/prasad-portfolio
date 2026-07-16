'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, Calendar, CheckCircle2, ChevronDown, Download, ExternalLink, Target, Users, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EXECUTIVE_METRICS } from '@/lib/executive-metrics';
import { CALENDLY_URLS } from '@/lib/tracking';
import { ThemeToggle } from '@/components/theme-toggle';

// ---------------------------------------------------------------------------
// Role fit calculator data
// ---------------------------------------------------------------------------

const ROLE_DIMENSIONS = [
  { id: 'vp-ai', label: 'Director / VP / Head of AI Engineering', score: 97, rationale: 'Built and led 200+ eng orgs at Krutrim & Ola; currently Director, AI Platform & Agentic Solutions at Zip. $10M+ revenue, 70% cost reduction, eval-gated CI.' },
  { id: 'caio', label: 'Chief AI Officer (CAIO)', score: 91, rationale: 'Platform strategy, board-level governance, AI FinOps, and org transformation at enterprise scale.' },
  { id: 'sd-platform', label: 'Sr. Director, AI Platform', score: 94, rationale: 'Deep hands-on platform architecture: RAG, agentic orchestration, observability, rate limiting.' },
  { id: 'vp-applied', label: 'VP Applied AI / ML', score: 82, rationale: 'Strong LLMOps foundation; not a pure ML research track — focus is production systems and business outcomes.' },
  { id: 'eng-mgr', label: 'Engineering Manager / Director', score: 88, rationale: 'Strong people leadership, but calibrated for VP / Head scope with P&L ownership.' },
] as const;

const SKILL_AREAS = [
  { label: 'Agentic AI & LLM Orchestration', level: 5, evidence: 'MCP demo, Multi-agent system, Edge-Cloud collaboration' },
  { label: 'Platform Architecture (RAG, Eval, FinOps)', level: 5, evidence: 'RAG pipeline, Evaluation showcase, LLM Router with cost tracking' },
  { label: 'Governance & HITL', level: 5, evidence: 'Live governance dashboard, eval-gated CI, HITL checkpoints' },
  { label: 'Global Engineering Org Leadership', level: 5, evidence: '200+ engineers, 3 continents, $8M–$20M P&L' },
  { label: 'AI FinOps & Cost Discipline', level: 5, evidence: '70% infra cost reduction at Ola; 40% AI inference savings at Krutrim' },
  { label: 'Enterprise AI Strategy', level: 4, evidence: 'AI operating model, board-ready governance posture, certifications' },
  { label: 'ML Research / Core Modeling', level: 3, evidence: 'Applied practitioner — focused on production systems, not research track' },
  { label: 'Pure Data Science / Analytics', level: 2, evidence: 'Engineered the platform; data science is a dependency, not the role' },
] as const;

const EVIDENCE_TRAIL = [
  { label: 'AI Evaluation Showcase', desc: 'Offline eval suites, drift detection, hallucination indicators, CI gating', href: '/demos/evaluation-showcase', tag: 'Flagship' },
  { label: 'Enterprise Control Plane', desc: 'RBAC, group spend limits, token analytics, observability feed', href: '/demos/enterprise-control-plane', tag: 'Governance' },
  { label: 'Multi-Agent System', desc: 'Groq + CrewAI, HITL checkpoints, audit trail, real LLM calls', href: '/demos/multi-agent', tag: 'Agentic' },
  { label: 'MCP Tool Demo', desc: 'Model Context Protocol — real tool discovery and execution trace', href: '/demos/mcp-demo', tag: 'Protocol' },
  { label: 'Agent Marketplace', desc: 'All 15 demos organized by capability tier and integration status', href: '/agent-marketplace', tag: 'Catalog' },
  { label: 'Governance Dashboard', desc: 'Live telemetry: safety, eval quality, cost controls, auditability', href: '/governance', tag: 'Operations' },
] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreBar({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const filled = Math.round(score / 10);
  return (
    <div className={`flex items-center gap-1 ${size === 'sm' ? 'gap-0.5' : 'gap-1'}`}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`rounded-sm transition-all ${size === 'sm' ? 'h-1.5 w-3' : 'h-2 w-4'}`}
          style={{
            background: i < filled
              ? `oklch(${0.5 + (score - 50) * 0.002} 0.24 264)`
              : 'var(--border)',
          }}
        />
      ))}
    </div>
  );
}

function SkillDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="size-2 rounded-full"
          style={{ background: i < level ? 'var(--accent-brand)' : 'var(--border)' }}
        />
      ))}
    </div>
  );
}

function FitCard({ role }: { role: typeof ROLE_DIMENSIONS[number] }) {
  const [open, setOpen] = useState(false);
  const color =
    role.score >= 90 ? 'text-green-400' :
    role.score >= 80 ? 'text-blue-400' :
    'text-muted-foreground';

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className={`text-2xl font-bold tabular-nums w-12 shrink-0 ${color}`}>
          {role.score}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{role.label}</p>
          <ScoreBar score={role.score} size="sm" />
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{role.rationale}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RecruiterDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'evidence' | 'path'>('overview');

  const tabs = [
    { id: 'overview', label: 'Role Fit', icon: Target },
    { id: 'skills', label: 'Skills Map', icon: BarChart3 },
    { id: 'evidence', label: 'Evidence', icon: BookOpen },
    { id: 'path', label: 'Review Path', icon: Zap },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Sticky header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/for-recruiters" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Recruiter Brief
            </Link>
            <span className="text-border">/</span>
            <span className="text-sm font-semibold text-foreground">Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/resume-download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: 'var(--accent-brand)' }}
            >
              <Download className="w-3.5 h-3.5" />
              Resume
            </a>
            <a
              href={CALENDLY_URLS.recruiters}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/40 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Book Call
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Hero band */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Recruiter Intelligence Dashboard
          </p>
          <h1 className="text-2xl font-bold text-foreground mb-1">Prasad Kavuri — AI Platform Executive</h1>
          <p className="text-sm text-muted-foreground">
            Director, AI Platform &amp; Agentic Solutions at Zip · Chicago
          </p>

          {/* Quick stat pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { icon: Users, label: `${EXECUTIVE_METRICS.engineersLed} engineers led` },
              { icon: BarChart3, label: `${EXECUTIVE_METRICS.revenueLaunched} revenue launched` },
              { icon: Zap, label: `${EXECUTIVE_METRICS.costReductionDisplay} AI cost reduction` },
              { icon: Target, label: `${EXECUTIVE_METRICS.yearsExperience} years experience` },
              { icon: Users, label: `${EXECUTIVE_METRICS.callCenterAutomation} call center automated` },
              { icon: BarChart3, label: `${EXECUTIVE_METRICS.poisIndexed} POIs indexed` },
              { icon: Target, label: `${EXECUTIVE_METRICS.languagesSupported}-language AI platform` },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Icon className="w-3 h-3" />
                {label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
              <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
              Actively interviewing
            </span>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 mb-6 rounded-xl border border-border bg-muted/30 p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                activeTab === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ─────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Role Fit Calculator
              </p>
              <div className="space-y-2">
                {ROLE_DIMENSIONS.map(role => (
                  <FitCard key={role.id} role={role} />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Scores reflect depth of verifiable evidence — not self-assessment. Each score links to live demos.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Preferred locations</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {['Chicago / Naperville, IL (on-site)', 'US Remote (preferred)', 'APAC / EMEA leadership (open)', 'Hybrid — Chicago metro'].map(l => (
                    <li key={l} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      {l}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Compensation context</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {[
                    'VP / Head level band',
                    'Equity participation expected',
                    '$8M–$20M budget ownership track record',
                    'Board-ready governance posture',
                  ].map(l => (
                    <li key={l} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      {l}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        )}

        {/* ── Tab: Skills Map ───────────────────────────────── */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Skills Depth Map — 5 dots = verifiable production evidence
            </p>
            {SKILL_AREAS.map(skill => (
              <div key={skill.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="text-sm font-semibold text-foreground">{skill.label}</p>
                  <SkillDots level={skill.level} />
                </div>
                <p className="text-xs text-muted-foreground">{skill.evidence}</p>
              </div>
            ))}
            <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">How to read this</p>
              <p className="text-xs text-muted-foreground">5 dots = live production demos with verifiable code. 3 dots = applied practitioner. 1–2 dots = honest signal about where the role focus is not.</p>
            </div>
          </div>
        )}

        {/* ── Tab: Evidence ─────────────────────────────────── */}
        {activeTab === 'evidence' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Live Evidence Artifacts — all running in production
            </p>
            {EVIDENCE_TRAIL.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:border-foreground/20 hover:bg-muted/30 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.tag}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        )}

        {/* ── Tab: Review Path ──────────────────────────────── */}
        {activeTab === 'path' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Recommended 3-Minute Review Path
            </p>
            {[
              { n: '1', title: 'Capabilities map', time: '30s', desc: 'Leadership-level platform view. One page. Start here.', href: '/capabilities', external: false },
              { n: '2', title: 'AI Evaluation Showcase', time: '60s', desc: 'The flagship: eval gating, drift detection, HITL, real LLM quality loop.', href: '/demos/evaluation-showcase', external: false },
              { n: '3', title: 'Enterprise AI Operating Model', time: '45s', desc: 'Board-facing governance, budget discipline, ROI signals.', href: '/enterprise-ai-operating-model', external: false },
              { n: '4', title: 'Live Governance Dashboard', time: '30s', desc: 'Real telemetry: safety, cost controls, audit trail.', href: '/governance', external: false },
              { n: '5', title: 'Book a 30-minute call', time: '1 min', desc: "I'll walk you through any part of the platform on a live call.", href: CALENDLY_URLS.recruiters, external: true },
            ].map(step => {
              const inner = (
                <div className="flex gap-4 items-start">
                  <span className="text-xl font-bold shrink-0 w-7 text-right tabular-nums" style={{ color: 'var(--accent-brand)' }}>
                    {step.n}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <span className="text-xs text-muted-foreground">({step.time})</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
              );
              const cls = 'block rounded-xl border border-border bg-card p-4 hover:border-foreground/20 hover:bg-muted/30 transition-all';
              return step.external
                ? <a key={step.n} href={step.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                : <Link key={step.n} href={step.href} className={cls}>{inner}</Link>;
            })}

            {/* CTA band */}
            <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Ready to connect?</p>
              <p className="text-sm text-muted-foreground mb-4">30-minute intro call. I'll walk through the platform architecture, governance controls, and how they map to your org's needs.</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={CALENDLY_URLS.recruiters}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: 'var(--accent-brand)' }}
                >
                  <Calendar className="w-4 h-4" />
                  Book 30-min Call
                </a>
                <a
                  href="mailto:vbkpkavuri@gmail.com"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40 transition-colors"
                >
                  vbkpkavuri@gmail.com
                </a>
                <a
                  href="https://www.linkedin.com/in/pkavuri/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
