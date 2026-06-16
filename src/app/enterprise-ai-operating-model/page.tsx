import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { SITE_URL } from '@/data/site-config';

const pageUrl = `${SITE_URL}/enterprise-ai-operating-model`;

export const metadata: Metadata = {
  title: 'Enterprise AI Operating Model',
  description:
    'Board-facing AI operating model evidence for Prasad Kavuri: governance, risk controls, AI FinOps, budget ownership, and production AI adoption.',
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: 'Enterprise AI Operating Model - Prasad Kavuri',
    description:
      'How Prasad Kavuri scales production AI with governance, operating cadence, budget discipline, and measurable business outcomes.',
    url: pageUrl,
  },
};

const operatingModel = [
  {
    title: 'Strategy to portfolio',
    detail:
      'Translate board and executive priorities into an AI portfolio with clear owners, value hypotheses, adoption milestones, and stop/go criteria.',
  },
  {
    title: 'Governance by default',
    detail:
      'Ship eval gates, human checkpoints, drift monitoring, prompt-injection checks, and audit trails with the platform rather than adding controls later.',
  },
  {
    title: 'AI FinOps discipline',
    detail:
      'Make model choice, token spend, latency, and infrastructure cost visible enough for engineering, finance, and product leaders to make tradeoffs together.',
  },
  {
    title: 'Operating cadence',
    detail:
      'Run AI delivery through metrics that executives can inspect: risk posture, model quality, adoption, cost per workflow, incident patterns, and business impact.',
  },
];

const boardSignals = [
  '200+ engineers led across US, India, and Europe',
  '$8M-$20M annual engineering budget responsibility',
  '$10M+ revenue launched from production AI platform work',
  '70% infrastructure cost reduction and 50% latency improvement signals',
  '13,000+ B2B customers enabled through platform-scale delivery',
  '15 production AI demos showing governance, routing, retrieval, evals, and agent controls',
];

const schema = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  '@id': `${pageUrl}#profile-page`,
  url: pageUrl,
  name: 'Enterprise AI Operating Model - Prasad Kavuri',
  description:
    'Board-facing evidence of enterprise AI operating model leadership, governance controls, AI FinOps, and production AI delivery.',
  mainEntity: {
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: 'Prasad Kavuri',
    jobTitle: 'VP / Head of AI Engineering',
    knowsAbout: [
      'Chief AI Officer',
      'Enterprise AI operating model',
      'AI governance',
      'AI FinOps',
      'Production AI platforms',
      'Model risk management',
    ],
  },
};

export default function EnterpriseAIOperatingModelPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Board-facing AI leadership evidence
        </p>
        <h1 className="mb-3 text-3xl font-bold text-foreground">
          Enterprise AI Operating Model
        </h1>
        <p className="mb-8 max-w-3xl text-muted-foreground">
          A practical CAIO operating model for moving AI from pilots to governed production:
          portfolio discipline, risk controls, AI FinOps, and board-readable business outcomes.
        </p>

        <section className="mb-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Operating System
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {operatingModel.map((item) => (
              <Card key={item.title} className="border-border bg-card p-5">
                <h2 className="mb-2 text-sm font-semibold text-foreground">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Board Signals
          </p>
          <div className="rounded-xl border border-border bg-card p-5">
            <ul className="grid gap-3 sm:grid-cols-2">
              {boardSignals.map((signal) => (
                <li key={signal} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-green-500" />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Controls In Practice
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link className="rounded-lg border border-border p-4 text-sm hover:bg-muted/40" href="/governance">
              Governance controls
            </Link>
            <Link className="rounded-lg border border-border p-4 text-sm hover:bg-muted/40" href="/demos/evaluation-showcase">
              Eval-gated quality
            </Link>
            <Link className="rounded-lg border border-border p-4 text-sm hover:bg-muted/40" href="/demos/enterprise-control-plane">
              Enterprise control plane
            </Link>
          </div>
        </section>

        <Link href="/for-recruiters" className="text-sm text-muted-foreground hover:text-foreground">
          Back to recruiter brief
        </Link>
      </div>
    </main>
  );
}
