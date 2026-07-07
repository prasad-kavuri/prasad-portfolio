import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { SITE_NAME, SITE_URL } from '@/data/site-config';

type RuntimeConcern = {
  title: string;
  description: string;
  enterpriseWhy: string;
  links: Array<{ href: string; label: string }>;
};

const concerns: RuntimeConcern[] = [
  {
    title: 'Agent Identity',
    description:
      'Agents need their own identity lifecycle — anonymous by default, upgradeable to a verified, Bearer-authenticated identity once trust is established.',
    enterpriseWhy:
      'Without agent identity, every action an agent takes is unattributable — no audit trail, no permission scoping, no accountability.',
    links: [{ href: '/demos/agent-auth', label: 'Agent Auth Demo' }],
  },
  {
    title: 'Prompt Versioning & Registry',
    description:
      'Prompts are versioned artifacts with hashes, not inline strings — each version tracked from draft through canary to stable, with an eval score at every promotion gate.',
    enterpriseWhy:
      'Prompts are the part of an agent most likely to change in production; versioning them like code is what makes changes reviewable and reversible.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Agent Lifecycle Tab' }],
  },
  {
    title: 'Canary Deployment & Rollback',
    description:
      'New prompt or policy versions roll out to a small traffic percentage first. If the eval score drops below a gate during the canary window, rollback is automatic.',
    enterpriseWhy:
      'Removes the choice between "ship fast" and "ship safe" — canary plus an automatic eval gate gives you both.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Agent Lifecycle Tab' }],
  },
  {
    title: 'Session Overrides & Policy Enforcement',
    description:
      'Per-team, per-session overrides (model tier, temperature, tool access, max tokens) let policy adjust agent behavior without touching the underlying prompt or code.',
    enterpriseWhy:
      'Compliance and cost constraints differ by team; overrides let one agent runtime serve all of them without forking the codebase.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Agent Lifecycle Tab' }],
  },
  {
    title: 'Tool Registry',
    description:
      'Tools are registered with declared permissions, availability, latency, and cost-efficiency metrics — not wired ad hoc into agent code.',
    enterpriseWhy:
      'A registry is what turns "the agent can call some functions" into a governed, auditable capability surface.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Tool Registry Tab' }, { href: '/demos/mcp-demo', label: 'MCP Protocol Demo' }],
  },
  {
    title: 'Capability Registry',
    description:
      'The Tool Registry, Prompt Registry (Agent Lifecycle tab), and the application-level Skills Catalog are three facets of one logical layer: everything an agent runtime can call on, versioned and governed rather than wired in ad hoc. A Workflow Library / Enterprise Playbooks tier is a natural extension of this layer that this portfolio does not yet implement.',
    enterpriseWhy:
      'Enterprises rarely lack capabilities — they lack a single place that knows which ones exist, who owns them, and what depends on what. Naming the registry as one layer, even when its parts live on different pages, is what makes that discoverable.',
    links: [
      { href: '/skills', label: 'Skills Catalog' },
      { href: '/demos/enterprise-control-plane', label: 'Tool + Prompt Registry Tabs' },
    ],
  },
  {
    title: 'Human Approval (HITL)',
    description:
      'Higher-risk agent actions pause at an explicit checkpoint for human approval before executing, with the decision logged to an audit trail.',
    enterpriseWhy:
      'The gate between an agent that reasons and an agent that acts unsupervised in production — required for anything touching money, customer data, or irreversible actions.',
    links: [{ href: '/demos/multi-agent', label: 'Multi-Agent HITL Demo' }, { href: '/demos/edge-agent-collaboration', label: 'Edge Agent Handoff' }],
  },
  {
    title: 'Memory',
    description:
      'Short-term session memory, long-term retrieval memory, and episodic session replay each serve a different purpose and need different retention and access rules.',
    enterpriseWhy:
      'Undifferentiated memory is a data-governance liability; scoped memory tiers are what make retention policy and PII handling tractable.',
    links: [{ href: '/demos/rag-pipeline', label: 'RAG Pipeline Demo' }],
  },
  {
    title: 'Observability',
    description:
      'Every tool call, connector call, and approval decision emits a structured event with trace ID, duration, and token cost — streamed to a live feed.',
    enterpriseWhy:
      'When an agent misbehaves in production, observability is the difference between a five-minute root cause and a multi-day investigation.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Observability Tab' }],
  },
];

export const metadata: Metadata = {
  title: 'Enterprise Agent Runtime',
  description:
    'Why agent runtime — prompt versioning, canary rollout, session overrides, tool registry, human approval, memory, and observability — matters more than the prompt itself.',
  alternates: {
    canonical: `${SITE_URL}/enterprise-agent-runtime`,
  },
  openGraph: {
    title: `Enterprise Agent Runtime — ${SITE_NAME}`,
    description:
      'Agent lifecycle, prompt versioning, canary deployment, session overrides, tool registry, human approval, memory, and observability for production agent systems.',
    url: `${SITE_URL}/enterprise-agent-runtime`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enterprise Agent Runtime — Prasad Kavuri',
    description: 'Why agent runtime matters more than the prompt — versioning, rollback, approval, and observability.',
  },
};

const agentRuntimeStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${SITE_URL}/enterprise-agent-runtime#collection-page`,
  url: `${SITE_URL}/enterprise-agent-runtime`,
  name: 'Enterprise Agent Runtime',
  description:
    'Agent lifecycle management — identity, prompt versioning, canary deployment, rollback, session overrides, tool registry, human approval, memory, and observability.',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: concerns.map((concern, index) => ({
      '@type': 'DefinedTerm',
      position: index + 1,
      name: concern.title,
      description: concern.description,
    })),
  },
};

export default function EnterpriseAgentRuntimePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(agentRuntimeStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="border-b border-border/60 bg-muted/20 py-10">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Agent Platform Layer</p>
            <h1 className="mt-2 text-3xl font-semibold">Enterprise Agent Runtime</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              A good prompt gets an agent working once. A runtime is what keeps it working — safely, reversibly, and
              observably — as it changes, scales, and touches production data. This is why agent runtime matters more
              than the prompt itself.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/demos/enterprise-control-plane" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Enterprise Control Plane
              </Link>
              <Link href="/demos/multi-agent" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Multi-Agent Demo
              </Link>
              <Link href="/demos/agent-auth" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Agent Auth Demo
              </Link>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="mx-auto max-w-5xl px-4">
            <Card className="border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this, not just prompts</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Prompt engineering answers &quot;what should the agent say.&quot; Runtime engineering answers &quot;what happens when
                it&apos;s wrong, when it needs to change, when it acts on real data, and when ten teams need different
                behavior from the same agent.&quot; Production-managed-agent patterns from industry (prompt registries,
                canary rollout, session-scoped overrides) point at the same conclusion: the runtime around the model is
                where enterprise reliability is actually won.
              </p>
            </Card>
          </div>
        </section>

        <section className="pb-14">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2">
            {concerns.map((concern) => (
              <Card key={concern.title} className="border-border bg-card p-5">
                <h2 className="text-base font-semibold text-foreground">{concern.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{concern.description}</p>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why it matters</p>
                <p className="mt-1 text-sm text-muted-foreground">{concern.enterpriseWhy}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {concern.links.map((link) => (
                    <Link
                      key={`${concern.title}-${link.href}`}
                      href={link.href}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
                    >
                      {link.label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
