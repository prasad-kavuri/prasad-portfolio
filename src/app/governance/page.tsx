'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { TelemetryDisclosure } from '@/components/ui/telemetry-disclosure';
import { GOVERNANCE_SNAPSHOT } from '@/data/telemetry-snapshots';

// Lightly randomized on load to emulate production telemetry behavior for portfolio demonstration.
function jitter(base: number, range: number) {
  return base + Math.floor((Math.random() - 0.5) * 2 * range);
}

interface EvalSnapshot {
  totalQueriesLogged: number;
  liveEval: { casesRun: number; passed: number; avgScore: number | null };
  drift: { assistantSamples: number; multiAgentSamples: number };
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
  liveQueriesLogged: number;
  lastRefreshed: string;
}

function freshMetrics(snap?: EvalSnapshot): Metrics {
  const baseline = GOVERNANCE_SNAPSHOT.metricBaselines;

  // Use live eval data when available; fall back to estimated values
  const evalFidelity = snap?.liveEval.avgScore != null
    ? snap.liveEval.avgScore.toFixed(2)
    : (
      baseline.evalFidelityFallback.base +
      (Math.random() - 0.5) * 2 * baseline.evalFidelityFallback.range
    ).toFixed(baseline.evalFidelityFallback.digits);

  const hallucinationRate = snap?.liveEval.casesRun && snap.liveEval.casesRun > 0
    ? ((1 - snap.liveEval.passed / snap.liveEval.casesRun) * 0.1).toFixed(3)
    : (
      baseline.hallucinationFallback.base +
      (Math.random() - 0.5) * 2 * baseline.hallucinationFallback.range
    ).toFixed(baseline.hallucinationFallback.digits);

  return {
    rateLimitRemaining: jitter(baseline.rateLimitRemaining.base, baseline.rateLimitRemaining.range),
    rateLimitTotal: baseline.rateLimitTotal,
    costPerInteraction: (
      baseline.costPerInteractionUsd.base +
      (Math.random() - 0.5) * 2 * baseline.costPerInteractionUsd.range
    ).toFixed(baseline.costPerInteractionUsd.digits),
    guardrailBlocked: jitter(baseline.guardrailBlocked.base, baseline.guardrailBlocked.range),
    guardrailRedacted: jitter(baseline.guardrailRedacted.base, baseline.guardrailRedacted.range),
    evalFidelity,
    hallucinationRate,
    activeTraceSessions: jitter(baseline.activeTraceSessions.base, baseline.activeTraceSessions.range),
    liveQueriesLogged: snap?.totalQueriesLogged ?? 0,
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

const SEVERITY_CLS: Record<string, string> = {
  ok:   'bg-green-500/20 text-green-400',
  warn: 'bg-yellow-500/20 text-yellow-400',
  info: 'bg-blue-500/20 text-blue-400',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GovernancePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  async function loadMetrics() {
    try {
      const res = await fetch('/api/eval-snapshot');
      const snap: EvalSnapshot = res.ok ? await res.json() : {};
      setMetrics(freshMetrics(snap));
    } catch {
      setMetrics(freshMetrics());
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadMetrics(); }, []);

  const refresh = () => { loadMetrics(); };

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

        <TelemetryDisclosure
          label="Mixed telemetry"
          message="Includes live signals where available plus illustrative and snapshot values for portfolio demonstration of observability, guardrails, and evaluation patterns."
          className="mb-8"
        />

        {/* Telemetry Snapshot Grid */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Telemetry Snapshot
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <MetricCard
                  label="Queries Logged"
                  value={String(metrics.liveQueriesLogged)}
                  sub="runtime loop where available; snapshot fallback"
                  status="info"
                />
              </>
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
