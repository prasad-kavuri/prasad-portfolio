import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DemosGallery } from '@/components/sections/DemosGallery';
import { demos } from '@/data/demos';
import { PORTFOLIO_FACTS, SITE_NAME, SITE_URL } from '@/data/site-config';

const demosUrl = `${SITE_URL}/demos`;

export const metadata: Metadata = {
  title: 'AI Demos',
  description:
    'Explore production AI platform demos across routing, retrieval, governance, multi-agent orchestration, and reliability patterns tied to enterprise outcomes.',
  alternates: {
    canonical: '/demos',
  },
  openGraph: {
    title: `AI Demos (${PORTFOLIO_FACTS.productionDemoCount}) — ${SITE_NAME}`,
    description:
      'Production AI demos with enterprise framing: cost-aware routing, grounded retrieval, governance controls, and resilient platform operations.',
    url: demosUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: `AI Demos (${PORTFOLIO_FACTS.productionDemoCount}) — ${SITE_NAME}`,
    description:
      'Enterprise AI demo index across routing, retrieval, governance, and multi-agent operational patterns.',
  },
};

const personId = `${SITE_URL}/#person`;

const demosStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${demosUrl}#collection-page`,
  url: demosUrl,
  name: `AI Demos (${PORTFOLIO_FACTS.productionDemoCount})`,
  description: 'Production AI platform demos by Prasad Kavuri mapping to enterprise leadership capabilities: cost optimization, governance, retrieval, orchestration, and reliability.',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  creator: { '@id': personId },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: demos.map((demo, index) => ({
      '@type': ['SoftwareApplication', 'CreativeWork'],
      position: index + 1,
      name: demo.title,
      url: `${SITE_URL}${demo.href}`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: demo.description,
      // abstract maps businessImpact — the leadership capability signal for each demo
      abstract: demo.businessImpact,
      keywords: demo.tags.join(', '),
      creator: { '@id': personId },
    })),
  },
};

export default function DemosIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(demosStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-md"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="border-b border-border/60 bg-muted/20 py-10">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-brand)' }}>
              AI Platform Modules
            </p>
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              {PORTFOLIO_FACTS.productionDemoCount} Production AI Modules
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Every module runs on a shared governance foundation — guardrails, rate limiting, observability, eval-gated CI, and drift monitoring. Each is tied to a real enterprise platform concern: quality, reliability, cost, retrieval, orchestration, or oversight.
            </p>
          </div>
        </section>
        <DemosGallery />
      </main>
      <Footer />
    </>
  );
}
