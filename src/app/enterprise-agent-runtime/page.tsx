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

type EcosystemMapping = {
  portfolioConcept: string;
  portfolioLink: { href: string; label: string };
  googleAnalog: string;
  note: string;
  source: { href: string; label: string };
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

// Maps this page's portfolio-native concerns onto Google's enterprise agent-platform ecosystem
// (Agent Development Kit, Vertex AI Agent Engine, Agentspace / Gemini Enterprise Agent Platform,
// Agent Identity, Agent Registry, Agent Gateway, A2A, Model Armor, current MCP spec) — added so the
// existing, already-built governance work here is legible to anyone evaluating it against that stack.
const googleEcosystemMapping: EcosystemMapping[] = [
  {
    portfolioConcept: 'Agent Identity',
    portfolioLink: { href: '/demos/agent-auth', label: 'Agent Auth Demo' },
    googleAnalog: 'Agent Identity',
    note: 'This demo\'s anonymous-to-verified identity lifecycle is the same problem Google\'s Agent Identity solves with SPIFFE-based per-agent identity (replacing shared service accounts), using mTLS by default and DPoP across Agent Gateway.',
    source: { href: 'https://docs.cloud.google.com/iam/docs/agent-identity-overview', label: 'Google Cloud: Agent Identity overview' },
  },
  {
    portfolioConcept: 'Tool / Capability Registry',
    portfolioLink: { href: '/demos/enterprise-control-plane', label: 'Tool Registry Tab' },
    googleAnalog: 'Agent Registry + Agent Gateway',
    note: 'Registering tools with declared permissions before they\'re callable is the same governance move as Google\'s Agent Registry (the catalog of approved agents, tools, and MCP servers) and Agent Gateway (the control plane that checks it before allowing a connection).',
    source: { href: 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/govern/gateways/agent-gateway-overview', label: 'Google Cloud: Agent Gateway overview' },
  },
  {
    portfolioConcept: 'Guardrails & Prompt-Injection Detection',
    portfolioLink: { href: '/demos/mcp-demo', label: 'MCP Tool Demo' },
    googleAnalog: 'Model Armor',
    note: 'This portfolio\'s injection-detection guardrails run per-app; Google\'s Model Armor is the equivalent runtime security layer applied centrally at Agent Gateway to all agent traffic, without per-agent code changes.',
    source: { href: 'https://cloud.google.com/security/products/model-armor', label: 'Google Cloud: Model Armor' },
  },
  {
    portfolioConcept: 'Standardized Tool-Calling Protocol',
    portfolioLink: { href: '/demos/mcp-demo', label: 'MCP Tool Demo' },
    googleAnalog: 'MCP (current spec)',
    note: 'The current MCP specification (2026-07-28) formalizes MCP servers as OAuth 2.1 resource servers and moves to a stateless protocol core — the enterprise-authorization direction this demo\'s tool-discovery flow points toward.',
    source: { href: 'https://blog.modelcontextprotocol.io/posts/2026-07-28/', label: 'MCP Blog: The 2026-07-28 Specification' },
  },
  {
    portfolioConcept: 'Multi-Agent Coordination',
    portfolioLink: { href: '/demos/multi-agent', label: 'Multi-Agent Demo' },
    googleAnalog: 'Agent2Agent (A2A) protocol',
    note: 'Analyzer → Researcher → Strategist handoff here is a single-process version of what A2A standardizes across independent agents — capability discovery via Agent Cards and task delegation, now Linux Foundation-governed with 150+ supporting organizations.',
    source: { href: 'https://a2a-protocol.org/latest/specification/', label: 'A2A Protocol Specification' },
  },
  {
    portfolioConcept: 'Agent Build & Managed Runtime',
    portfolioLink: { href: '/demos/multi-agent', label: 'Multi-Agent Demo' },
    googleAnalog: 'Agent Development Kit (ADK) + Vertex AI Agent Engine',
    note: 'This portfolio\'s hand-rolled orchestration (Groq-based agent classes, sequential/parallel handoffs) is the vendor-neutral pattern that ADK codifies as a framework, deployable to Google\'s managed Agent Engine runtime without a rewrite.',
    source: { href: 'https://docs.cloud.google.com/agent-builder/agent-development-kit/overview', label: 'Google Cloud: Agent Development Kit overview' },
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
            <p className="mt-3 text-xs text-muted-foreground">
              Part of the <Link href="/capabilities#lifecycle" className="underline hover:text-foreground">Enterprise Capability Lifecycle</Link> — this page covers Versioning &amp; Runtime.
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

        <section className="pb-14">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ecosystem Alignment</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                How this maps to Google&apos;s enterprise agent-platform ecosystem
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Each concern above is a vendor-neutral pattern. Where Google&apos;s Gemini Enterprise Agent
                Platform names the same pattern as a product, that mapping is below — with a link to the
                primary source.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {googleEcosystemMapping.map((item) => (
                <Card key={item.portfolioConcept} className="border-border bg-card p-5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">{item.portfolioConcept}</h3>
                    <span className="text-xs font-medium text-muted-foreground">→ {item.googleAnalog}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={item.portfolioLink.href}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
                    >
                      {item.portfolioLink.label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <a
                      href={item.source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    >
                      {item.source.label}
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
