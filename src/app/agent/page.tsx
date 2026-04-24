import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowRight, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Agent Entry Point — Prasad Kavuri | Head of AI Engineering',
  description:
    'Machine-readable portfolio entry for AI agents and recruiting systems. Prasad Kavuri: agentic AI, LLM orchestration, AI governance, 200+ engineers, 70% cost reduction.',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://www.prasadkavuri.com/agent',
  },
};

// ---------------------------------------------------------------------------
// Sub-components (match for-recruiters visual language)
// ---------------------------------------------------------------------------

function StatCard({ number, label, supporting }: { number: string; label: string; supporting: string }) {
  return (
    <Card className="border-border bg-card p-5">
      <p className="text-3xl font-bold text-foreground mb-1">{number}</p>
      <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">{supporting}</p>
    </Card>
  );
}

function EntryLink({
  href,
  label,
  note,
  external,
}: {
  href: string;
  label: string;
  note?: string;
  external?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {note && <span className="ml-2 text-xs text-muted-foreground">{note}</span>}
      </div>
      {external ? (
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      ) : (
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      )}
    </div>
  );

  const cls =
    'block rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/30 hover:bg-muted/30';

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Capability hierarchy data
// ---------------------------------------------------------------------------

const CAPABILITY_TREE = [
  {
    root: 'AI Platform Leadership',
    branches: [
      {
        label: 'Agentic AI Systems',
        leaves: [
          'Multi-agent orchestration',
          'Human-in-the-loop governance',
          'Audit trails & observability',
        ],
      },
      {
        label: 'LLM Platforms',
        leaves: [
          'LLM routing & cost optimization',
          'RAG & vector search',
          'Evaluation & drift monitoring',
        ],
      },
      {
        label: 'Enterprise AI Operations',
        leaves: [
          'AI governance & FinOps',
          'RBAC & spend controls',
          'OpenTelemetry observability',
        ],
      },
      {
        label: 'Platform Engineering',
        leaves: [
          'Distributed systems at scale',
          'Maps & location intelligence',
          'Cloud-native architecture',
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* ── Section 1: Identity block ──────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            AI Agent Entry Point
          </p>
          <h1 className="text-3xl font-bold text-foreground mb-1">Prasad Kavuri</h1>
          <p className="text-lg text-muted-foreground mb-1">
            Head of AI Engineering / AI Platform Leader
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Chicago, IL — open to remote
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'VP AI',
              'Head of AI Engineering',
              'Senior Director AI Platform',
              'AI Transformation Leader',
            ].map((role) => (
              <span
                key={role}
                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* ── Section 2: Core capabilities ──────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Core Capabilities
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Agentic AI Orchestration',
              'LLM Routing & Cost Optimization',
              'AI Governance & HITL Systems',
              'RAG Pipelines & Vector Search',
              'Multi-Agent Systems',
              'Drift Monitoring & Eval Gating',
              'AI FinOps',
              'Enterprise Platform Engineering',
            ].map((cap) => (
              <span
                key={cap}
                className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* ── Section 3: Proof points ────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Proof Points
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              number="200+"
              label="Engineers Led"
              supporting="Global teams across India, US, Europe"
            />
            <StatCard
              number="70%+"
              label="AI Cost Reduction"
              supporting="AI inference infrastructure at scale"
            />
            <StatCard
              number="$10M+"
              label="Revenue Impact"
              supporting="From AI systems in production"
            />
          </div>
        </div>

        {/* ── Section 4: Capability hierarchy ───────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Capability Hierarchy
          </p>
          <div className="rounded-xl border border-border bg-card p-5">
            {CAPABILITY_TREE.map(({ root, branches }) => (
              <div key={root}>
                <p className="text-sm font-semibold text-foreground mb-3">{root}</p>
                <ul className="space-y-3 pl-2">
                  {branches.map(({ label, leaves }, bi) => (
                    <li key={label}>
                      <div className="flex items-start gap-2">
                        <span className="mt-1 text-xs text-muted-foreground select-none">
                          {bi < branches.length - 1 ? '├──' : '└──'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <ul className="mt-1 space-y-0.5 pl-4">
                            {leaves.map((leaf, li) => (
                              <li key={leaf} className="flex items-start gap-2">
                                <span className="mt-1 text-xs text-muted-foreground select-none">
                                  {li < leaves.length - 1 ? '├──' : '└──'}
                                </span>
                                <span className="text-xs text-muted-foreground">{leaf}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 5: Recommended entry points ───────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Recommended Entry Points
          </p>

          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Internal
          </p>
          <div className="grid gap-2 sm:grid-cols-2 mb-4">
            <EntryLink href="/" label="/" note="Portfolio home" />
            <EntryLink href="/for-recruiters" label="/for-recruiters" note="Executive summary & resume" />
            <EntryLink href="/demos" label="/demos" note="All 13 AI demos" />
            <EntryLink href="/demos/evaluation-showcase" label="/demos/evaluation-showcase" note="Flagship demo" />
            <EntryLink href="/governance" label="/governance" note="AI governance & HITL patterns" />
          </div>

          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Machine-Readable
          </p>
          <div className="grid gap-2 sm:grid-cols-2 mb-4">
            <EntryLink href="/ai-profile.json" label="/ai-profile.json" note="Structured identity (JSON)" />
            <EntryLink href="/llms.txt" label="/llms.txt" note="LLM-readable narrative summary" />
          </div>

          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            External
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <EntryLink
              href="https://github.com/prasad-kavuri/prasad-portfolio"
              label="github.com/prasad-kavuri/prasad-portfolio"
              external
            />
          </div>
        </div>

        {/* ── Section 6: Footer CTA ─────────────────────────────────────── */}
        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            For executive search inquiries:{' '}
            <a
              href="mailto:vbkpkavuri@gmail.com"
              className="font-medium text-foreground hover:underline"
            >
              vbkpkavuri@gmail.com
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
