import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { SITE_NAME, SITE_URL } from '@/data/site-config';

type GovernanceControl = {
  title: string;
  description: string;
  enterpriseWhy: string;
  links: Array<{ href: string; label: string }>;
};

const controls: GovernanceControl[] = [
  {
    title: 'Runtime Risk Classification',
    description:
      'Every request is classified into a risk tier — standard, security-sensitive, regulated, or blocked — before a model is ever selected, not reviewed after the fact.',
    enterpriseWhy:
      'Static, point-in-time policy review cannot keep pace with agentic systems making thousands of routing decisions a day. Classification has to run at request time.',
    links: [{ href: '/demos/llm-router', label: 'Live Runtime Governance Panel' }],
  },
  {
    title: 'Risk-Aware Model Routing',
    description:
      'Standard requests proceed through normal cost/latency routing. Security-sensitive requests are downgraded to a restricted model tier pending human review. Regulated-domain requests proceed under policy with a mandatory audit entry. Prompt-injection attempts are blocked outright.',
    enterpriseWhy:
      'A model router that only optimizes for cost and latency is incomplete — enterprise routing has to account for what a request is asking, not just how hard it is.',
    links: [{ href: '/demos/llm-router', label: 'Live Runtime Governance Panel' }],
  },
  {
    title: 'Human Approval Escalation',
    description:
      'When a request is classified as security-sensitive, the runtime marks it as pending human review rather than either silently allowing or silently refusing it.',
    enterpriseWhy:
      'Binary allow/block governance loses information. An escalation path preserves the request for a human decision instead of forcing a false choice.',
    links: [{ href: '/demos/multi-agent', label: 'Multi-Agent HITL Demo' }, { href: '/enterprise-agent-runtime', label: 'Enterprise Agent Runtime' }],
  },
  {
    title: 'Policy-Governed Regulated Requests',
    description:
      'Requests touching regulated domains (medical, legal, financial, compliance-sensitive) are not blocked — they proceed under policy, with a mandatory audit trail entry attached.',
    enterpriseWhy:
      'Over-blocking regulated topics makes an assistant useless for real enterprise workflows; the safer control is auditability, not refusal.',
    links: [{ href: '/demos/llm-router', label: 'Live Runtime Governance Panel' }],
  },
  {
    title: 'Prompt Injection Blocking',
    description:
      'Requests matching known prompt-injection and jailbreak signatures are blocked before reaching any model, and the block is written to the audit trail.',
    enterpriseWhy:
      'This reuses the same injection-detection logic already enforced on every API route in this platform — one control, applied consistently, not duplicated per demo.',
    links: [{ href: '/governance', label: 'Governance Dashboard' }],
  },
  {
    title: 'Audit Trail on Every Decision',
    description:
      'Every risk classification — standard, restricted, policy-approved, or blocked — is a structured, traceable decision, not a silent pass-through.',
    enterpriseWhy:
      'Compliance and incident response both depend on being able to answer "why did the system do that" after the fact, for every request, not just the flagged ones.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Observability Tab' }],
  },
];

export const metadata: Metadata = {
  title: 'Adaptive AI Governance',
  description:
    'The rise of autonomous, multi-agent AI systems expands the enterprise threat model beyond prompt-level controls. Runtime risk classification and risk-aware model routing, honestly scoped against the broader threat model — not a static policy document.',
  alternates: {
    canonical: `${SITE_URL}/adaptive-ai-governance`,
  },
  openGraph: {
    title: `Adaptive AI Governance — ${SITE_NAME}`,
    description:
      'Runtime risk classification, risk-aware model routing, human approval escalation, and audit trails — enterprise AI governance as a runtime layer, not a static policy.',
    url: `${SITE_URL}/adaptive-ai-governance`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Adaptive AI Governance — Prasad Kavuri',
    description: 'Governance as an active runtime layer: risk classification, routing, escalation, and audit — live.',
  },
};

const governanceStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${SITE_URL}/adaptive-ai-governance#collection-page`,
  url: `${SITE_URL}/adaptive-ai-governance`,
  name: 'Adaptive AI Governance',
  description:
    'Runtime risk classification, risk-aware model routing, human approval escalation, policy-governed regulated requests, prompt injection blocking, and audit trail — enterprise AI governance as a runtime layer.',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: controls.map((control, index) => ({
      '@type': 'DefinedTerm',
      position: index + 1,
      name: control.title,
      description: control.description,
    })),
  },
};

export default function AdaptiveAIGovernancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(governanceStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="border-b border-border/60 bg-muted/20 py-10">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Runtime Governance Layer</p>
            <h1 className="mt-2 text-3xl font-semibold">Adaptive AI Governance</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              The rise of autonomous, multi-agent AI systems expands the enterprise threat model beyond
              prompt-level controls, requiring continuous runtime governance, policy enforcement, execution
              monitoring, and auditability. This platform classifies every request&apos;s risk tier before a
              model is selected, and routes standard, security-sensitive, regulated, and blocked requests
              differently — live, not as a policy document.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Part of the <Link href="/capabilities#lifecycle" className="underline hover:text-foreground">Enterprise Capability Lifecycle</Link> — this page covers Validation &amp; Approval.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/demos/llm-router" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Live Runtime Governance Panel
              </Link>
              <Link href="/governance" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Governance Dashboard
              </Link>
              <Link href="/enterprise-agent-runtime" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Agent Runtime
              </Link>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="mx-auto max-w-5xl px-4">
            <Card className="border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Where this sits</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Adaptive governance sits between the model router and the model itself — layer 6 of the platform&apos;s
                15-layer execution flow. It is a genuinely new layer added to this architecture, not a renamed existing
                one: standard model routing decides <em>which</em> model based on cost and complexity, this layer
                decides <em>whether</em> and <em>how</em> the request should proceed at all.
              </p>
            </Card>
          </div>
        </section>

        <section className="pb-10">
          <div className="mx-auto max-w-5xl px-4">
            <Card className="border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enforced today vs. the broader threat model</p>
              <p className="mt-2 text-sm text-muted-foreground">
                The risk classifier below operates at request/routing time — one decision, made once, before a
                model is selected. That is one instrument in a larger set enterprises need as agents move from
                single prompts to long-running, multi-step execution: plan → call tool → read memory → write
                memory → delegate → call MCP server → repeat. Being precise about the difference matters more
                than claiming broader coverage than what is actually built.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Enforced today, live</p>
                  <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                    <li>Prompt injection blocking</li>
                    <li>Security-sensitive request restriction</li>
                    <li>Regulated-domain policy + audit</li>
                    <li>Human approval escalation (HITL)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Broader enterprise threat model</p>
                  <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                    <li>Tool abuse across a running agent</li>
                    <li>Memory poisoning</li>
                    <li>MCP misuse</li>
                    <li>Cross-agent coordination, workflow escalation, data exfiltration</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="pb-14">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2">
            {controls.map((control) => (
              <Card key={control.title} className="border-border bg-card p-5">
                <h2 className="text-base font-semibold text-foreground">{control.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{control.description}</p>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why it matters</p>
                <p className="mt-1 text-sm text-muted-foreground">{control.enterpriseWhy}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {control.links.map((link) => (
                    <Link
                      key={`${control.title}-${link.href}`}
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
