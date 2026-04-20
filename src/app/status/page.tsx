import Link from 'next/link';
import { STATUS_SNAPSHOT } from '@/data/telemetry-snapshots';
import { STACK_LABELS } from '@/lib/stackVersions';
import { PORTFOLIO_FACTS, SITE_URL } from '@/data/site-config';

export const metadata = {
  title: 'System Status — Prasad Kavuri',
  description: `System status and mixed telemetry snapshot for ${PORTFOLIO_FACTS.productionDemoCount} production AI systems on ${SITE_URL}.`,
};

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-background p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">System Status</h1>
      <p className="text-muted-foreground">www.prasadkavuri.com</p>
      <p className="text-xs text-slate-500 mt-1 mb-8">Snapshot — April 2026</p>

      <div
        role="note"
        aria-label="Portfolio telemetry model"
        className="border border-border bg-muted/20 rounded-xl px-5 py-4 mb-8"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Portfolio Telemetry
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Live service health where instrumented; representative baselines elsewhere.
            All controls are implemented in code and verified in CI.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground shrink-0">
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

      <section className="mb-8" aria-labelledby="trust-controls-heading">
        <h2 id="trust-controls-heading" className="text-xl font-semibold mb-4">Trust Controls</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {STATUS_SNAPSHOT.trustControls.map(([label, detail]) => (
            <div key={label} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🟢 All Systems Operational</h2>
        <div className="grid gap-3">
          {STATUS_SNAPSHOT.services.map(([name, status]) => (
            <div key={name} className="flex justify-between items-center p-3 rounded-lg border border-border">
              <span className="font-medium">{name}</span>
              <span className="text-sm text-green-500">✓ {status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🔒 Security Posture</h2>
        <div className="grid gap-2 text-sm">
          {STATUS_SNAPSHOT.securityPosture.map(item => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🧪 Test Suite</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {STATUS_SNAPSHOT.testSuite.map(([label, value]) => (
            <div key={label} className="p-3 rounded-lg border border-border">
              <div className="text-muted-foreground">{label}</div>
              <div className="font-semibold text-green-500">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">⚙️ Stack</h2>
        <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
          {STACK_LABELS.map(([name, version]) => (
            <span key={name} className="font-mono">▸ {name} {version}</span>
          ))}
        </div>
      </section>

      <div className="mt-8 pt-8 border-t border-border text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">← Back to portfolio</Link>
      </div>
    </main>
  );
}
