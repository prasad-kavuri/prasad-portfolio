import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PORTFOLIO_FACTS, SITE_URL } from '@/data/site-config';

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

const maturityModel = [
  {
    stage: 'Prompt Engineering',
    detail: 'Single-call prompting against a foundation model, no retrieval or tool use.',
    current: false,
  },
  {
    stage: 'RAG',
    detail: 'Retrieval-augmented generation with vector search grounds responses in owned data.',
    current: false,
  },
  {
    stage: 'Single Agent',
    detail: 'One agent with tool access and a defined task scope, no cross-agent coordination.',
    current: false,
  },
  {
    stage: 'Multi-Agent',
    detail: 'Coordinated agents (analyzer, researcher, strategist) handing off work with shared context.',
    current: false,
  },
  {
    stage: 'Managed Agents',
    detail: 'Agents run under a control plane: RBAC, spend limits, structured observability, human checkpoints.',
    current: false,
  },
  {
    stage: 'Enterprise AI Platform',
    detail: 'Governed agent runtime at organization scale — identity, policy engine, prompt versioning, canary rollout, rollback, FinOps, and audit as platform primitives, not bolt-ons.',
    current: true,
  },
];

const REPO = 'https://github.com/prasad-kavuri/prasad-portfolio/blob/main';

/**
 * Alignment map: controls that are implemented and tested in this portfolio's open-source code,
 * mapped to NIST AI RMF 1.0 functions and ISO/IEC 42001:2023 Annex A control areas.
 * It is an alignment map, not a certification or compliance claim.
 */
const FRAMEWORK_ALIGNMENT = [
  {
    fn: 'Govern',
    iso: 'A.2 AI policies · A.3 Internal organization',
    controls: [
      'Default-deny tool policy: every agent tool declares its required scope; unknown tools are refused',
      'Separate identities for the requesting user and the agent service principal, both recorded on every call',
      'Fail-closed secrets: credential signing stops in production when the secret is missing',
      'Spec-before-code change process with human approval for security-relevant changes',
    ],
    evidence: [
      { label: 'Tool policy', href: `${REPO}/src/lib/tool-policy.ts` },
      { label: 'Change specs', href: 'https://github.com/prasad-kavuri/prasad-portfolio/tree/main/specs' },
    ],
  },
  {
    fn: 'Map',
    iso: 'A.8 Information for interested parties',
    controls: [
      'A2A Agent Card and auth.md publish what the agent can do, which scopes each skill needs, and how to get a credential',
      'Golden scenarios enumerate the risk cases up front: over-threshold payments, duplicates, and poisoned vendor data',
      'Every demo declares its execution mode (browser, server, or remote agent) in one registry',
    ],
    evidence: [
      { label: 'Agent Card', href: '/.well-known/agent-card.json' },
      { label: 'auth.md', href: '/auth.md' },
    ],
  },
  {
    fn: 'Measure',
    iso: 'A.6 AI system life cycle (verification and validation)',
    controls: [
      'Trajectory evaluation scores each agent version on tool order, tool precision and recall, outcome accuracy, and safety violations',
      'Eval suites and coverage thresholds run in CI on every push',
      'Gateway spans record tool, principal, decision, reason, and latency for each call',
    ],
    evidence: [
      { label: 'Release gate', href: '/api/flagship/release-gate' },
      { label: 'Trajectory eval', href: `${REPO}/src/lib/flagship/trajectory-eval.ts` },
    ],
  },
  {
    fn: 'Manage',
    iso: 'A.9 Use of AI systems · A.10 Third-party relationships · A.7 Data',
    controls: [
      'Consequential actions pause for human approval: single use, time-limited, bound to what was staged, replays rejected',
      'A candidate that violates a safety case is rolled back from canary automatically',
      'Tool and remote-agent outputs are treated as untrusted and screened for injected instructions',
      'Daily spend caps and rate limits on every AI route; structured PII is re-checked before any cloud handoff',
    ],
    evidence: [
      { label: 'Flagship demo', href: '/demos/governed-agent-platform' },
      { label: 'Tool gateway', href: `${REPO}/src/lib/tool-gateway.ts` },
    ],
  },
];

const boardSignals = [
  '200+ engineers led across US, India, and Europe',
  '$8M-$20M annual engineering budget responsibility',
  '$10M+ revenue launched from production AI platform work',
  '70% infrastructure cost reduction and 50% latency improvement signals',
  '13,000+ B2B customers enabled through platform-scale delivery',
  `${PORTFOLIO_FACTS.productionDemoCount} production AI demos showing governance, routing, retrieval, evals, and agent controls`,
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
    jobTitle: 'Head of AI Platform & Agentic Solutions',
    knowsAbout: [
      'Chief AI Officer',
      'Enterprise AI operating model',
      'AI governance',
      'AI FinOps',
      'Production AI platforms',
      'Model risk management',
      'NIST AI Risk Management Framework',
      'ISO/IEC 42001',
    ],
  },
};

export default function EnterpriseAIOperatingModelPage() {
  return (
    <>
    <Navbar />
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-background text-foreground">
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
            AI Platform Maturity Model
          </p>
          <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
            Most organizations stall between single-agent pilots and governed production. This is the
            path from prompt engineering to an enterprise AI platform, and where this work sits on it today.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
            {maturityModel.map((step, i) => (
              <div key={step.stage} className="flex items-stretch gap-2 sm:flex-1 sm:min-w-[150px]">
                <div
                  className={`flex-1 rounded-lg border p-4 ${
                    step.current
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {step.stage}
                    {step.current && (
                      <span className="ml-2 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600">
                        Current focus
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>
                </div>
                {i < maturityModel.length - 1 && (
                  <span className="hidden items-center text-muted-foreground sm:flex" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10" aria-labelledby="framework-alignment">
          <p id="framework-alignment" className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Framework Alignment — NIST AI RMF and ISO/IEC 42001
          </p>
          <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
            How the controls running in this portfolio&apos;s open-source code line up with the four NIST AI RMF 1.0
            functions and the ISO/IEC 42001:2023 Annex A control areas. It shows how I structure AI governance so
            auditors and risk partners can trace a control to code. It is an alignment map, not a certification.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {FRAMEWORK_ALIGNMENT.map((row) => (
              <Card key={row.fn} className="border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground">{row.fn}</h2>
                <p className="mb-3 text-xs text-muted-foreground">ISO/IEC 42001 · {row.iso}</p>
                <ul className="mb-3 space-y-1.5">
                  {row.controls.map((control) => (
                    <li key={control} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" />
                      {control}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Evidence:{' '}
                  {row.evidence.map((item, i) => (
                    <span key={item.href}>
                      {i > 0 && ' · '}
                      <a href={item.href} className="underline underline-offset-2 hover:text-foreground">
                        {item.label}
                      </a>
                    </span>
                  ))}
                </p>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link className="rounded-lg border border-border p-4 text-sm hover:bg-muted/40" href="/demos/governed-agent-platform">
              Governed agent platform (flagship)
            </Link>
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

      </div>
    </main>
    <Footer />
    </>
  );
}
