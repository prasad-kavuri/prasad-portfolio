import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { SITE_NAME, SITE_URL } from '@/data/site-config';

type Capability = {
  title: string;
  description: string;
  enterpriseWhy: string;
  evidence: string[];
  links: Array<{ href: string; label: string }>;
};

const capabilities: Capability[] = [
  {
    title: 'Agentic AI Systems',
    description: 'Designs multi-agent workflows with explicit role boundaries, checkpoints, and deterministic execution paths.',
    enterpriseWhy: 'Helps enterprises automate complex workflows without losing control, accountability, or release discipline.',
    evidence: [
      'Multi-agent workflow demo with HITL checkpoint and approval gates',
      'Agentic architecture patterns represented across demo and governance surfaces',
    ],
    links: [
      { href: '/demos/multi-agent', label: 'Multi-Agent Demo' },
      { href: '/governance', label: 'Governance Dashboard' },
    ],
  },
  {
    title: 'Tool / MCP Orchestration',
    description: 'Implements tool-aware LLM patterns and MCP-style interaction models for structured agent-to-tool coordination.',
    enterpriseWhy: 'Standardized tool orchestration reduces brittle custom integrations and improves operational reliability.',
    evidence: [
      'MCP tool demo with explicit tool discovery and invocation flow',
      'Recent MCP-focused certification signal in certifications hub',
    ],
    links: [
      { href: '/demos/mcp-demo', label: 'MCP Tool Demo' },
      { href: '/certifications', label: 'Certifications' },
    ],
  },
  {
    title: 'LLM Routing and Model Selection',
    description: 'Routes requests by complexity and constraints to balance quality, latency, and cost.',
    enterpriseWhy: 'Enables cost-aware scaling while preserving response quality and reducing unnecessary premium-model spend.',
    evidence: [
      'Live model routing demo with latency and cost comparisons',
      'Routing rationale and business projection views for decision support',
    ],
    links: [
      { href: '/demos/llm-router', label: 'LLM Router Demo' },
      { href: '/demos/evaluation-showcase', label: 'Evaluation Showcase' },
    ],
  },
  {
    title: 'RAG and Knowledge Retrieval',
    description: 'Builds retrieval-augmented patterns combining semantic embeddings, retrieval ranking, and grounded response assembly.',
    enterpriseWhy: 'Improves answer grounding and reduces unsupported outputs in enterprise knowledge workflows.',
    evidence: [
      'Browser-native RAG pipeline with controlled fallback mode',
      'Retrieval-focused demo path for grounded portfolio assistant behavior',
    ],
    links: [
      { href: '/demos/rag-pipeline', label: 'RAG Pipeline Demo' },
      { href: '/demos/portfolio-assistant', label: 'Portfolio Assistant Demo' },
    ],
  },
  {
    title: 'Vector Search and Semantic Systems',
    description: 'Applies embedding-based semantic retrieval and ranking to improve discovery across unstructured information.',
    enterpriseWhy: 'Turns natural-language intent into practical retrieval for support, operations, and decision workflows.',
    evidence: [
      'Vector search demo with embedding visualization and ranked retrieval',
      'Resilience patterns for degraded local-inference conditions',
    ],
    links: [
      { href: '/demos/vector-search', label: 'Vector Search Demo' },
      { href: '/demos/rag-pipeline', label: 'RAG Demo' },
    ],
  },
  {
    title: 'AI Governance and Human-in-the-Loop',
    description: 'Operationalizes guardrails, policy controls, and approval checkpoints for higher-risk AI actions.',
    enterpriseWhy: 'Supports safe adoption by making governance enforceable, visible, and auditable in delivery workflows.',
    evidence: [
      'Governance dashboard with controls, audit events, and trust flow',
      'HITL checkpoints in multi-agent execution path',
    ],
    links: [
      { href: '/governance', label: 'Governance Dashboard' },
      { href: '/demos/enterprise-control-plane', label: 'Enterprise Control Plane' },
    ],
  },
  {
    title: 'Observability, Reliability, and Fallbacks',
    description: 'Builds systems with runtime telemetry, resilience handling, and explicit degraded-mode behavior.',
    enterpriseWhy: 'Improves production stability and user trust when models, backends, or dependencies fail.',
    evidence: [
      'Evaluation and governance telemetry surfaces',
      'Backend/init fallback and retry paths across browser-native demos',
    ],
    links: [
      { href: '/demos/evaluation-showcase', label: 'Evaluation Showcase' },
      { href: '/demos', label: 'Demo Index' },
    ],
  },
  {
    title: 'AI FinOps and Cost-Latency Optimization',
    description: 'Treats cost and latency as first-class platform constraints, not afterthoughts.',
    enterpriseWhy: 'Improves AI unit economics and scaling feasibility for enterprise rollout.',
    evidence: [
      'Routing economics and model tradeoff patterns in LLM router',
      'Quantization benchmarking and model-size/performance comparisons',
    ],
    links: [
      { href: '/demos/llm-router', label: 'LLM Router' },
      { href: '/demos/quantization', label: 'Quantization Demo' },
    ],
  },
  {
    title: 'Platform Modernization',
    description: 'Connects AI capability delivery with cloud/platform transformation, reliability, and productization.',
    enterpriseWhy: 'Accelerates movement from isolated pilots to reusable platform capability across business units.',
    evidence: [
      'Architecture and transformation sections map system-level platform model',
      'Cross-demo shared platform controls in the codebase and governance model',
    ],
    links: [
      { href: '/#architecture', label: 'Architecture' },
      { href: '/#transformation', label: 'Transformation' },
    ],
  },
  {
    title: 'Executive AI Platform Leadership',
    description: 'Combines strategic leadership narrative with implementation-level depth across AI platform concerns.',
    enterpriseWhy: 'Relevant for VP/Head/Senior Director hiring where outcomes require both org leadership and technical credibility.',
    evidence: [
      'Recruiter-first summary path with executive metrics and guided review flow',
      'Production-style portfolio with governance, evals, and operational controls',
    ],
    links: [
      { href: '/for-recruiters', label: 'For Recruiters' },
      { href: '/certifications', label: 'Certifications' },
    ],
  },
];

export const metadata: Metadata = {
  title: 'AI Platform Capabilities',
  description:
    'Executive capability map connecting AI platform leadership areas to portfolio evidence across demos, governance, and certifications.',
  alternates: {
    canonical: `${SITE_URL}/capabilities`,
  },
  openGraph: {
    title: `AI Platform Capabilities — ${SITE_NAME}`,
    description:
      'Agentic orchestration, governance, retrieval systems, reliability, and AI FinOps capabilities with linked portfolio evidence.',
    url: `${SITE_URL}/capabilities`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'AI Platform Capabilities map' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Platform Capabilities — Prasad Kavuri',
    description: 'Capability map for enterprise AI platform leadership, linked to demos and governance evidence.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

const capabilitiesStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${SITE_URL}/capabilities#collection-page`,
  url: `${SITE_URL}/capabilities`,
  name: 'AI Platform Capabilities',
  description:
    'Executive capability graph mapping AI platform leadership areas to portfolio evidence, demos, governance, and certifications.',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: capabilities.map((capability, index) => ({
      '@type': 'DefinedTerm',
      position: index + 1,
      name: capability.title,
      description: capability.description,
    })),
  },
};

export default function CapabilitiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(capabilitiesStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="border-b border-border/60 bg-muted/20 py-10">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Executive Capability Graph</p>
            <h1 className="mt-2 text-3xl font-semibold">AI Platform Capabilities</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              A high-signal capability map linking enterprise AI platform skills to concrete portfolio evidence.
              Use this page to evaluate platform leadership scope in one pass.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/for-recruiters" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Recruiter Summary
              </Link>
              <Link href="/demos" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Demo Index
              </Link>
              <Link href="/certifications" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Certifications
              </Link>
              <Link href="/governance" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Governance
              </Link>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <Card key={capability.title} className="border-border bg-card p-5">
                <h2 className="text-base font-semibold text-foreground">{capability.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{capability.description}</p>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why it matters</p>
                <p className="mt-1 text-sm text-muted-foreground">{capability.enterpriseWhy}</p>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Portfolio evidence</p>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {capability.evidence.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap gap-2">
                  {capability.links.map((link) => (
                    <Link
                      key={`${capability.title}-${link.href}`}
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
