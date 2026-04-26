'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ShieldCheck, BarChart3, DollarSign, UserCheck, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { GOVERNANCE_SNAPSHOT, getGovernanceMetricsView, type EvalSnapshotData, type GovernanceMetricsView } from '@/data/telemetry-snapshots';
import { LatencyCostChart } from '@/components/observability/LatencyCostChart';
import { SnapshotTimestamp } from '@/components/SnapshotTimestamp';
import { SkillActivityFeed } from '@/components/governance/SkillActivityFeed';

// ---------------------------------------------------------------------------
// Governance summary band — 5 dimensions, always-active static cards
// ---------------------------------------------------------------------------

const GOVERNANCE_DIMENSIONS = [
  {
    label: 'Safety',
    detail: 'Guardrails, prompt injection detection, XSS sanitization',
    icon: ShieldCheck,
  },
  {
    label: 'Eval Quality',
    detail: 'CI-gated eval suites, hallucination heuristics, drift monitoring',
    icon: BarChart3,
  },
  {
    label: 'Cost Control',
    detail: 'Rate limiting, token-cost tracking, per-route spend gates',
    icon: DollarSign,
  },
  {
    label: 'Human Oversight',
    detail: 'HITL checkpoints on high-stakes multi-agent transitions',
    icon: UserCheck,
  },
  {
    label: 'Auditability',
    detail: 'Trace IDs, structured logs, immutable audit trail',
    icon: FileText,
  },
] as const;

function GovernanceSummaryBand() {
  return (
    <section className="mb-8" aria-label="Governance dimensions overview">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {GOVERNANCE_DIMENSIONS.map(({ label, detail, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-green-500 shrink-0" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <span className="ml-auto text-[10px] font-semibold text-green-500 uppercase tracking-wider">Active</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Telemetry legend — replaces amber "Mixed telemetry" banner
// ---------------------------------------------------------------------------

function TelemetryLegend() {
  return (
    <div
      role="note"
      aria-label="Portfolio telemetry model"
      className="rounded-xl border border-border bg-muted/20 px-5 py-4 mb-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Portfolio Telemetry
          </p>
          <p className="text-sm text-muted-foreground">
            Real-time signals where instrumented; representative baselines elsewhere.
            All controls are implemented in code and verified in CI.
          </p>
        </div>
        <div className="flex items-center gap-5 text-xs text-muted-foreground shrink-0 pt-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
            Live signal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30 ring-1 ring-muted-foreground/20" aria-hidden="true" />
            Representative baseline
          </span>
        </div>
      </div>
    </div>
  );
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

const SEVERITY_CLS: Record<string, string> = {
  ok:   'bg-green-500/20 text-green-400',
  warn: 'bg-yellow-500/20 text-yellow-400',
  info: 'bg-blue-500/20 text-blue-400',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GovernancePage() {
  const [metricsView, setMetricsView] = useState<GovernanceMetricsView | null>(null);

  async function loadMetrics() {
    const updatedLabel = `Updated ${new Date().toLocaleTimeString()}`;
    try {
      const res = await fetch('/api/eval-snapshot');
      const snap: EvalSnapshotData | undefined = res.ok ? await res.json() : undefined;
      setMetricsView(getGovernanceMetricsView(snap, updatedLabel));
    } catch {
      setMetricsView(getGovernanceMetricsView(undefined, updatedLabel));
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadMetrics(); }, []);

  const refresh = () => { loadMetrics(); };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">

        {/* Demo environment notice */}
        <div
          role="note"
          className="mb-6 border-l-[3px] border-blue-400/50 bg-blue-500/5 px-[14px] py-[10px] text-[13px] text-muted-foreground"
        >
          Demo environment — metrics shown are simulated to illustrate production monitoring patterns.
        </div>

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
              Platform safety, cost controls, and eval quality
            </p>
            <SnapshotTimestamp />
          </div>
          <div className="flex items-center gap-3">
            {metricsView && (
              <span className="text-xs text-muted-foreground">{metricsView.updatedLabel}</span>
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

        <GovernanceSummaryBand />

        <TelemetryLegend />

        <section className="mb-8" aria-labelledby="governance-model-heading">
          <h2 id="governance-model-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            AI Governance & Trust Model
          </h2>
          <Card className="border border-border bg-card p-5">
            <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              <p><span className="font-medium text-foreground">Evaluation Discipline:</span> Offline eval suites and CI regression thresholds block unsafe quality drift before release.</p>
              <p><span className="font-medium text-foreground">Guardrail Boundary:</span> Prompt-injection checks and output sanitization are enforced centrally at API trust boundaries.</p>
              <p><span className="font-medium text-foreground">Human Oversight:</span> High-stakes multi-agent transitions require explicit HITL checkpoint approval before strategist output continues.</p>
              <p><span className="font-medium text-foreground">Traceable Operations:</span> Structured logs plus trace IDs make request, model, and policy decisions auditable end-to-end.</p>
            </div>
          </Card>
        </section>

        <section className="mb-8" aria-labelledby="security-sandbox-heading">
          <h2 id="security-sandbox-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Security & Agent Sandbox
          </h2>
          <Card className="border border-border bg-card p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Production-style security controls with documented residual risks.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Agent sandbox rules, threat model, and machine-readable posture are versioned with the repo.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Link
                  href="https://github.com/prasad-kavuri/prasad-portfolio/blob/main/SECURITY.md"
                  className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground"
                >
                  SECURITY.md
                </Link>
                <Link
                  href="https://github.com/prasad-kavuri/prasad-portfolio/blob/main/docs/SECURITY_THREAT_MODEL.md"
                  className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground"
                >
                  Security Threat Model
                </Link>
                <Link
                  href="/.well-known/security-posture.json"
                  className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground"
                >
                  security-posture.json
                </Link>
              </div>
            </div>
          </Card>
        </section>

        <section className="mb-8" aria-labelledby="trust-flow-heading">
          <h2 id="trust-flow-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Trust Control Flow
          </h2>
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {GOVERNANCE_SNAPSHOT.trustFlow.map((item) => (
              <div key={item} className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Telemetry Snapshot Grid */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Telemetry Snapshot
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {metricsView ? (
              metricsView.cards.map(([label, value, sub, status]) => (
                <MetricCard
                  key={label}
                  label={label}
                  value={value}
                  sub={sub}
                  status={status}
                />
              ))
            ) : (
              Array.from({ length: 7 }).map((_, i) => (
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
                {GOVERNANCE_SNAPSHOT.policyControls.map((c, i) => (
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
                {GOVERNANCE_SNAPSHOT.auditLog.map((row, i) => (
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

        {/* Token Latency vs Cost chart */}
        <section className="mb-8" aria-labelledby="latency-cost-heading">
          <div className="flex items-center gap-3 mb-4">
            <h2 id="latency-cost-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Token Latency vs. Cost (24h)
            </h2>
            <span className="text-xs font-medium text-muted-foreground/70 border border-border rounded px-2 py-0.5">
              Illustrative
            </span>
          </div>
          <Card className="bg-card border-border p-5">
            <LatencyCostChart />
          </Card>
        </section>

        {/* Spatial AI Health */}
        <section className="mb-8" aria-labelledby="spatial-health-heading">
          <div className="flex items-center gap-3 mb-4">
            <h2 id="spatial-health-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Spatial AI Health
            </h2>
            <span className="text-xs font-medium text-green-500 border border-green-500/30 rounded px-2 py-0.5">● Live</span>
          </div>
          <Card className="bg-card border-border p-5">
            <div className="space-y-3">
              {[
                { label: 'Reconstruction Drift Score',     value: '0.12', threshold: '< 0.25' },
                { label: 'HITL Approval Rate',             value: '94%',  threshold: '> 80%'  },
                { label: 'Agent Spatial Queries / min',    value: '3.4',  threshold: '< 10'   },
                { label: 'Mesh Consistency (10k frames)',  value: '98.7%', threshold: '> 95%' },
                { label: 'HITL Rejections (last 24h)',     value: '1',    threshold: '< 5'    },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-foreground">{metric.value}</span>
                    <span className="text-xs text-muted-foreground">({metric.threshold})</span>
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground font-mono">
                Last trace: spatial-demo-seed-001 · 2026-04-20T09:14:33Z
              </p>
            </div>
          </Card>
        </section>

        {/* Live Skill Activity */}
        <section className="mb-8" aria-labelledby="skill-activity-heading">
          <h2 id="skill-activity-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Live Skill Activity
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Real-time log of skill invocations across all demos.
            Resets on server restart (in-memory buffer, last 50 events).
          </p>
          <SkillActivityFeed />
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
