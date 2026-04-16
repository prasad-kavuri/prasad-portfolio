import Link from 'next/link';
import { TelemetryDisclosure } from '@/components/ui/telemetry-disclosure';
import { STATUS_SNAPSHOT } from '@/data/telemetry-snapshots';

export const metadata = {
  title: 'System Status — Prasad Kavuri',
  description: 'System status and mixed telemetry snapshot for 13 production AI systems on prasadkavuri.com',
};

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-background p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">System Status</h1>
      <p className="text-muted-foreground">prasadkavuri.com</p>
      <p className="text-sm text-muted-foreground mb-8">Snapshot generated at: {STATUS_SNAPSHOT.generatedAtIso}</p>

      <TelemetryDisclosure
        label="Mixed telemetry"
        message="Includes live service health where available plus snapshot and illustrative metrics for portfolio demonstration."
        className="mb-8"
      />

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
          {STATUS_SNAPSHOT.stack.map(item => (
            <span key={item} className="font-mono">▸ {item}</span>
          ))}
        </div>
      </section>

      <div className="mt-8 pt-8 border-t border-border text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">← Back to portfolio</Link>
      </div>
    </main>
  );
}
