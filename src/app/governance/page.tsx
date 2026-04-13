'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { TelemetryDisclosure } from '@/components/ui/telemetry-disclosure';
import { GOVERNANCE_SNAPSHOT, getGovernanceMetricsView, type EvalSnapshotData, type GovernanceMetricsView } from '@/data/telemetry-snapshots';

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
              Platform safety, cost controls, and eval quality — {GOVERNANCE_SNAPSHOT.generatedAtLabel}
            </p>
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
