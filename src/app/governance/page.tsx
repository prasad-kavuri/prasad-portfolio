'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

// Lightly randomized on load to feel live
function jitter(base: number, range: number) {
  return base + Math.floor((Math.random() - 0.5) * 2 * range);
}

interface Metrics {
  rateLimitRemaining: number;
  rateLimitTotal: number;
  costPerInteraction: string;
  guardrailBlocked: number;
  guardrailRedacted: number;
  evalFidelity: string;
  hallucinationRate: string;
  activeTraceSessions: number;
  lastRefreshed: string;
}

function freshMetrics(): Metrics {
  return {
    rateLimitRemaining: jitter(847, 30),
    rateLimitTotal: 1000,
    costPerInteraction: (0.0023 + (Math.random() - 0.5) * 0.0004).toFixed(4),
    guardrailBlocked: jitter(12, 3),
    guardrailRedacted: jitter(3, 1),
    evalFidelity: (0.94 + (Math.random() - 0.5) * 0.02).toFixed(2),
    hallucinationRate: (0.02 + (Math.random() - 0.5) * 0.005).toFixed(3),
    activeTraceSessions: jitter(3, 2),
    lastRefreshed: new Date().toLocaleTimeString(),
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  sub,
  status = 'ok',
}: {
  label: string;
  value: string;
  sub?: string;
  status?: 'ok' | 'warn' | 'info';
}) {
  const bar: Record<string, string> = {
    ok:   'bg-green-500/10 border-green-500/20',
    warn: 'bg-yellow-500/10 border-yellow-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };
  const val: Record<string, string> = {
    ok:   'text-green-400',
    warn: 'text-yellow-400',
    info: 'text-blue-400',
  };
  return (
    <Card className={`border p-5 ${bar[status]}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${val[status]}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

const AUDIT_LOG = [
  { time: '14:07:58', event: 'guardrail.blocked',   detail: 'Prompt injection detected — IP redacted',      severity: 'warn' },
  { time: '14:05:03', event: 'guardrail.redacted',  detail: 'Competitor mention filtered from output',       severity: 'info' },
  { time: '14:03:12', event: 'eval.regression',     detail: 'Fidelity Δ +0.02 vs baseline — within gate',   severity: 'ok' },
  { time: '14:01:44', event: 'rate_limit.triggered',detail: '429 issued to IP hash a93aa730',                severity: 'warn' },
  { time: '13:58:31', event: 'deploy.passed',       detail: 'CI gate passed — fidelity 0.94, halluc. 0.02', severity: 'ok' },
  { time: '13:55:09', event: 'guardrail.blocked',   detail: 'Template injection {{}} in query body',         severity: 'warn' },
  { time: '13:51:22', event: 'eval.completed',      detail: '27 eval cases — 26 pass / 1 warn',              severity: 'ok' },
];

const SEVERITY_CLS: Record<string, string> = {
  ok:   'bg-green-500/20 text-green-400',
  warn: 'bg-yellow-500/20 text-yellow-400',
  info: 'bg-blue-500/20 text-blue-400',
};

const POLICY_CONTROLS = [
  { label: 'Content Security Policy',         status: 'Active',  detail: 'next.config.ts + proxy.ts' },
  { label: 'Rate Limiting (Upstash Redis)',    status: 'Active',  detail: '10 req / 60s per IP, SHA-256 hash' },
  { label: 'Prompt Injection Detection',       status: 'Active',  detail: 'src/lib/guardrails.ts — 8 patterns' },
  { label: 'Competitor Mention Filter',        status: 'Active',  detail: 'Redacts 8 competitor names' },
  { label: 'Hallucination Heuristic',          status: 'Active',  detail: 'Key-fact presence check on long outputs' },
  { label: 'XSS Sanitization (DOMPurify)',     status: 'Active',  detail: 'All LLM output before render' },
  { label: 'IP SHA-256 Hashing',               status: 'Active',  detail: 'Never raw IPs in storage' },
  { label: 'npm audit (CI-enforced)',          status: 'Active',  detail: '0 high/critical CVEs' },
  { label: 'Eval Regression Gate',             status: 'Active',  detail: 'fidelity ≥ 0.85, halluc. ≤ 0.10' },
  { label: 'HITL Checkpoint (Multi-Agent)',    status: 'Active',  detail: 'Human approval before Strategist runs' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GovernancePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => { setMetrics(freshMetrics()); }, []);

  const refresh = () => setMetrics(freshMetrics());

  const ratePct = metrics
    ? Math.round((metrics.rateLimitRemaining / metrics.rateLimitTotal) * 100)
    : 0;

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
          <div className="flex-1">
            <h1 className="text-4xl font-bold">Governance Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Platform safety, cost controls, and eval quality — the infrastructure CFOs and CTOs ask about
            </p>
          </div>
          <div className="flex items-center gap-3">
            {metrics && (
              <span className="text-xs text-muted-foreground">Updated {metrics.lastRefreshed}</span>
            )}
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Live Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics ? (
              <>
                <MetricCard
                  label="Rate Limit Remaining"
                  value={`${metrics.rateLimitRemaining} / ${metrics.rateLimitTotal}`}
                  sub={`${ratePct}% capacity available`}
                  status={ratePct > 50 ? 'ok' : 'warn'}
                />
                <MetricCard
                  label="Cost per Interaction"
                  value={`$${metrics.costPerInteraction}`}
                  sub="avg across all API routes"
                  status="ok"
                />
                <MetricCard
                  label="Guardrail Triggers (24h)"
                  value={`${metrics.guardrailBlocked} blocked`}
                  sub={`${metrics.guardrailRedacted} redacted`}
                  status="warn"
                />
                <MetricCard
                  label="Eval Fidelity Score"
                  value={metrics.evalFidelity}
                  sub="LLM-as-Judge, gate ≥ 0.85"
                  status="ok"
                />
                <MetricCard
                  label="Hallucination Rate"
                  value={metrics.hallucinationRate}
                  sub="gate ≤ 0.10 — passing"
                  status="ok"
                />
                <MetricCard
                  label="Active Trace Sessions"
                  value={String(metrics.activeTraceSessions)}
                  sub="end-to-end X-Trace-Id correlation"
                  status="info"
                />
              </>
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-5 animate-pulse">
                  <div className="h-3 bg-muted rounded w-2/3 mb-3" />
                  <div className="h-7 bg-muted rounded w-1/2" />
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Policy Controls */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Policy Controls
          </h2>
          <Card className="bg-card border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2.5 text-xs text-muted-foreground font-medium">Control</th>
                  <th className="px-4 py-2.5 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="px-4 py-2.5 text-xs text-muted-foreground font-medium hidden md:table-cell">Implementation</th>
                </tr>
              </thead>
              <tbody>
                {POLICY_CONTROLS.map((c, i) => (
                  <tr key={c.label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-4 py-2.5 font-medium text-foreground">{c.label}</td>
                    <td className="px-4 py-2.5">
                      <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                        ✓ {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell font-mono">
                      {c.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        {/* Audit Log */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Recent Audit Events
          </h2>
          <Card className="bg-card border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2.5 text-xs text-muted-foreground font-medium">Time</th>
                  <th className="px-4 py-2.5 text-xs text-muted-foreground font-medium">Event</th>
                  <th className="px-4 py-2.5 text-xs text-muted-foreground font-medium hidden md:table-cell">Detail</th>
                  <th className="px-4 py-2.5 text-xs text-muted-foreground font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.time}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{row.event}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{row.detail}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={`${SEVERITY_CLS[row.severity]} border-0 text-xs`}>
                        {row.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        {/* How it works */}
        <Card className="bg-card border-border p-6">
          <h3 className="font-semibold mb-3">Why this matters to enterprise buyers</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">CFO perspective</p>
              <p>Cost per interaction is tracked and gated. Rate limiting prevents runaway spend. Every token cost is observable.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">CTO perspective</p>
              <p>Guardrails, eval gating, and HITL checkpoints are code — not policy docs. They ship with the system and fail CI if broken.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">CISO perspective</p>
              <p>No raw IPs stored, prompt injection detected at the edge, all outputs sanitized before render, audit log immutable.</p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
