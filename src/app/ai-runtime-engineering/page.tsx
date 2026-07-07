import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { SITE_NAME, SITE_URL } from '@/data/site-config';

type RuntimeTechnique = {
  title: string;
  description: string;
  enterpriseWhy: string;
  links: Array<{ href: string; label: string }>;
};

const techniques: RuntimeTechnique[] = [
  {
    title: 'Speculative Decoding',
    description:
      'A smaller draft model proposes several candidate tokens ahead of the main model, which verifies them in parallel instead of generating one token at a time.',
    enterpriseWhy:
      'Cuts latency without changing output quality or requiring a new model — the main lever behind recent industry throughput gains.',
    links: [{ href: '/demos/quantization', label: 'Quantization Demo' }],
  },
  {
    title: 'KV Cache Management',
    description:
      'Reuses key/value attention state across decoding steps instead of recomputing it, trading memory for compute.',
    enterpriseWhy:
      'Directly determines how many concurrent sessions a given GPU fleet can serve — a core FinOps lever, not just an engineering detail.',
    links: [{ href: '/demos/llm-router', label: 'LLM Router Demo' }],
  },
  {
    title: 'Prefix / Context Caching',
    description:
      'Caches the KV state for shared prompt prefixes (system prompts, RAG context) across requests so repeated context is not recomputed.',
    enterpriseWhy:
      'High-value for enterprise workloads where many requests share the same system prompt or retrieved context.',
    links: [{ href: '/demos/rag-pipeline', label: 'RAG Pipeline Demo' }],
  },
  {
    title: 'Continuous & Dynamic Batching',
    description:
      'Instead of batching fixed groups of requests, the scheduler continuously admits and evicts requests from an in-flight batch as they finish.',
    enterpriseWhy:
      'Raises GPU utilization and throughput under bursty, unpredictable enterprise traffic patterns.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Enterprise Control Plane' }],
  },
  {
    title: 'Quantization',
    description:
      'Reduces numeric precision of model weights (FP32 → INT8 or lower) to shrink memory footprint and increase throughput, with measurable accuracy tradeoffs.',
    enterpriseWhy:
      'Makes larger models deployable on smaller hardware footprints — a direct cost lever, benchmarked live in the quantization demo.',
    links: [{ href: '/demos/quantization', label: 'Quantization Demo' }],
  },
  {
    title: 'Inference Scheduling & GPU Optimization',
    description:
      'Orchestrates request placement, batching windows, and hardware allocation across a fleet to balance latency SLOs against cost.',
    enterpriseWhy:
      'The difference between a demo that works and a platform that survives production traffic at scale.',
    links: [{ href: '/demos/enterprise-control-plane', label: 'Enterprise Control Plane' }],
  },
];

export const metadata: Metadata = {
  title: 'AI Runtime Engineering',
  description:
    'Why enterprise AI outcomes depend on inference runtime engineering — speculative decoding, KV/prefix caching, continuous batching, and quantization — not just foundation model choice.',
  alternates: {
    canonical: `${SITE_URL}/ai-runtime-engineering`,
  },
  openGraph: {
    title: `AI Runtime Engineering — ${SITE_NAME}`,
    description:
      'Speculative decoding, KV cache, prefix cache, continuous batching, and quantization: the inference layer that determines enterprise AI cost and latency.',
    url: `${SITE_URL}/ai-runtime-engineering`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Runtime Engineering — Prasad Kavuri',
    description: 'The inference runtime techniques that determine enterprise AI cost, latency, and scale.',
  },
};

const runtimeStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${SITE_URL}/ai-runtime-engineering#collection-page`,
  url: `${SITE_URL}/ai-runtime-engineering`,
  name: 'AI Runtime Engineering',
  description:
    'Inference runtime techniques — speculative decoding, KV/prefix caching, continuous batching, quantization — mapped to enterprise cost and latency outcomes.',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: techniques.map((technique, index) => ({
      '@type': 'DefinedTerm',
      position: index + 1,
      name: technique.title,
      description: technique.description,
    })),
  },
};

export default function AIRuntimeEngineeringPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(runtimeStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="border-b border-border/60 bg-muted/20 py-10">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Inference Runtime Layer</p>
            <h1 className="mt-2 text-3xl font-semibold">AI Runtime Engineering</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Foundation model choice gets the headlines, but enterprise cost, latency, and scale are decided one layer
              down — in the inference runtime. This page maps the runtime techniques that turn a working model into a
              production-viable platform.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Part of the <Link href="/capabilities#lifecycle" className="underline hover:text-foreground">Enterprise Capability Lifecycle</Link> — this page covers Execution at the inference layer.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/capabilities" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Capability Map
              </Link>
              <Link href="/demos/quantization" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Quantization Demo
              </Link>
              <Link href="/demos" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40">
                Demo Index
              </Link>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="mx-auto max-w-5xl px-4">
            <Card className="border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Industry signal</p>
              <p className="mt-2 text-sm text-muted-foreground">
                In June 2026, DeepSeek open-sourced <strong className="text-foreground">DSpark</strong>, a speculative-decoding
                stack for its V4 models. DeepSeek&apos;s own benchmarks show <strong className="text-foreground">57–85% throughput
                gains as the typical, conservative outcome</strong>, with headline figures up to 400% reflecting corner cases at
                specific concurrency levels rather than the norm — and those numbers are self-reported, without independent
                third-party verification as of this writing. The direction is real: runtime-layer optimization, not just
                larger models, is now a primary axis of competition in production inference.
              </p>
            </Card>
          </div>
        </section>

        <section className="pb-14">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2">
            {techniques.map((technique) => (
              <Card key={technique.title} className="border-border bg-card p-5">
                <h2 className="text-base font-semibold text-foreground">{technique.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{technique.description}</p>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why it matters</p>
                <p className="mt-1 text-sm text-muted-foreground">{technique.enterpriseWhy}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {technique.links.map((link) => (
                    <Link
                      key={`${technique.title}-${link.href}`}
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
