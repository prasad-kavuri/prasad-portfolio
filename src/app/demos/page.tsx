import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AITools } from '@/components/sections/AITools';
import { demos } from '@/data/demos';
import { PORTFOLIO_FACTS, SITE_NAME, SITE_URL } from '@/data/site-config';

const demosUrl = `${SITE_URL}/demos`;

export const metadata: Metadata = {
  title: 'AI Demos',
  description:
    'Explore production AI demos across evaluation, agentic orchestration, governance, retrieval, multimodal systems, and platform tooling.',
  alternates: {
    canonical: '/demos',
  },
  openGraph: {
    title: `AI Demos (${PORTFOLIO_FACTS.productionDemoCount}) — ${SITE_NAME}`,
    description:
      'Production AI demos running on shared governance infrastructure: guardrails, observability, evaluation, and drift monitoring.',
    url: demosUrl,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'Prasad Kavuri AI demos' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `AI Demos (${PORTFOLIO_FACTS.productionDemoCount}) — ${SITE_NAME}`,
    description:
      'Production AI demos across evaluation, multi-agent orchestration, governance, and multimodal systems.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

const demosStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${demosUrl}#collection-page`,
  url: demosUrl,
  name: `AI Demos (${PORTFOLIO_FACTS.productionDemoCount})`,
  isPartOf: { '@id': `${SITE_URL}/#website` },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: demos.map((demo, index) => ({
      '@type': 'SoftwareApplication',
      position: index + 1,
      name: demo.title,
      url: `${SITE_URL}${demo.href}`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: demo.description,
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
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="border-b border-border/60 bg-muted/20 py-10">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI Demo Index</p>
            <h1 className="mt-2 text-3xl font-semibold">All Production Demos</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {PORTFOLIO_FACTS.productionDemoCount} production demos running on a shared governance foundation.
            </p>
          </div>
        </section>
        <AITools />
      </main>
      <Footer />
    </>
  );
}
