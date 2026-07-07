import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { SITE_NAME, SITE_URL } from '@/data/site-config';

type FinOpsLever = {
  title: string;
  description: string;
  enterpriseWhy: string;
  links: Array<{ href: string; label: string }>;
};

const levers: FinOpsLever[] = [
  {
    title: 'Cost per Request',
    description:
      'Every model tier has a real per-request cost floor set by input/output token pricing. Routing the wrong request to the wrong tier is the single largest avoidable AI spend line.',
    enterpriseWhy:
      'Making this number visible per request — not just per month — is what turns AI spend from a black box into something a CFO can forecast.',
    links: [{ href: '/demos/llm-router', label: 'LLM Router Demo' }],
  },
  {
    title: 'Routing Savings',
    description:
      'Complexity-aware routing sends simple queries to smaller, cheaper models and reserves large models for prompts that actually need them.',
    enterpriseWhy:
      'The router demo computes savings percent and projected dollar savings live, against a real baseline-vs-recommended comparison — not a static claim.',
    links: [{ href: '/demos/llm-router', label: 'Live Savings Calculation' }],
  },
  {
    title: 'Cache Hit Rate & Token Efficiency',
    description:
      'Prefix/KV cache hit rate directly determines how many tokens are billed at full input price ($3/MTok) versus cache-read price ($0.30/MTok) — a 10x difference.',
    enterpriseWhy:
      'Cache hit rate is a leading indicator of inference cost, tracked per model and per use case (RAG, multi-turn chat, code generation) in the control plane.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Inference Efficiency Tab' }],
  },
  {
    title: 'GPU Utilization',
    description:
      'Idle GPU memory and compute is spend with no output. Utilization tracking across GPU memory, CPU memory, and disk shows whether capacity matches actual serving load.',
    enterpriseWhy:
      'Enterprises overprovision inference hardware by default; visibility into utilization is what justifies right-sizing decisions.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Inference Efficiency Tab' }],
  },
  {
    title: 'Speculative Decode Savings',
    description:
      'Speculative decoding trades a small amount of draft-model compute for large reductions in end-to-end latency and, at scale, GPU-hours per request served.',
    enterpriseWhy:
      'This is the same runtime-layer lever behind DeepSeek’s June 2026 DSpark release — detailed with sourcing and caveats on the Runtime Engineering page.',
    links: [{ href: '/ai-runtime-engineering', label: 'AI Runtime Engineering' }],
  },
  {
    title: 'Budget Governance & Business ROI',
    description:
      'Per-team monthly budgets, spend-to-budget ratios, and alert thresholds turn AI cost from a reactive surprise into a managed line item, attributable to team and workload.',
    enterpriseWhy:
      'ROI conversations require attribution: which team, which workload, which model tier produced which outcome at what cost.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Spend & Tokens Tab' }],
  },
];

export const metadata: Metadata = {
  title: 'AI FinOps',
  description:
    'Cost per request, routing savings, cache hit rate, GPU utilization, and budget governance — the AI FinOps levers that determine whether enterprise AI spend scales predictably or runs away.',
  alternates: {
    canonical: `${SITE_URL}/ai-finops`,
  },
  openGraph: {
    title: `AI FinOps — ${SITE_NAME}`,
    description:
      'Cost per request, routing savings, cache hit rate, GPU utilization, and budget governance for enterprise AI platforms.',
    url: `${SITE_URL}/ai-finops`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI FinOps — Prasad Kavuri',
    description: 'The cost levers that determine whether enterprise AI spend scales predictably.',
  },
};

const finOpsStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${SITE_URL}/ai-finops#collection-page`,
  url: `${SITE_URL}/ai-finops`,
  name: 'AI FinOps',
  description:
    'Cost per request, routing savings, cache hit rate, GPU utilization, speculative decode savings, and budget governance for enterprise AI platforms.',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: levers.map((lever, index) => ({
      '@type': 'DefinedTerm',
      position: index + 1,
      name: lever.title,
      description: lever.description,
    })),
  },
};

export default function AIFinOpsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finOpsStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="border-b border-border/60 bg-muted/20 py-10">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Executive Cost Discipline</p>
            <h1 className="mt-2 text-3xl font-semibold">AI FinOps</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              AI spend scales unpredictably when cost is invisible until the invoice arrives. These are the levers
              that make AI spend forecastable, attributable, and defensible to a CFO — each backed by a live,
              interactive dashboard rather than a static claim.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Part of the <Link href="/capabilities#lifecycle" className="underline hover:text-foreground">Enterprise Capability Lifecycle</Link> — this page covers Continuous Improvement.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/demos/enterprise-control-plane" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Enterprise Control Plane
              </Link>
              <Link href="/demos/llm-router" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                LLM Router Demo
              </Link>
              <Link href="/ai-runtime-engineering" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Runtime Engineering
              </Link>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="mx-auto max-w-5xl px-4">
            <Card className="border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pricing basis</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Cost figures across these dashboards use a representative token-rate table (Input $3/MTok, Output
                $15/MTok, Cache read $0.30/MTok, Cache write $3.75/MTok) for relative comparison — not a live billing
                feed. The goal is to make the shape of AI cost tradeoffs concrete, not to quote a specific vendor&apos;s
                current price sheet.
              </p>
            </Card>
          </div>
        </section>

        <section className="pb-14">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2">
            {levers.map((lever) => (
              <Card key={lever.title} className="border-border bg-card p-5">
                <h2 className="text-base font-semibold text-foreground">{lever.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{lever.description}</p>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why it matters</p>
                <p className="mt-1 text-sm text-muted-foreground">{lever.enterpriseWhy}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {lever.links.map((link) => (
                    <Link
                      key={`${lever.title}-${link.href}`}
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
