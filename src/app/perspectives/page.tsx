import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PERSPECTIVES } from '@/data/perspectives';
import { SITE_URL } from '@/data/site-config';

const pageUrl = `${SITE_URL}/perspectives`;

export const metadata: Metadata = {
  title: 'Perspectives on Enterprise AI Platforms — Prasad Kavuri',
  description:
    'Essays by Prasad Kavuri on why enterprise AI stalls, the tradeoffs that matter in production AI, and how agentic AI changes the way work gets done.',
  alternates: { canonical: pageUrl },
  openGraph: {
    title: 'Perspectives — Prasad Kavuri',
    description: 'Essays on enterprise AI platforms, production tradeoffs, and agentic operating models.',
    url: pageUrl,
  },
};

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${pageUrl}#collection`,
  url: pageUrl,
  name: 'Perspectives — Prasad Kavuri',
  author: { '@id': `${SITE_URL}/#person` },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: PERSPECTIVES.map((article, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${pageUrl}/${article.slug}`,
      name: article.title,
    })),
  },
};

export default function PerspectivesIndexPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd).replace(/</g, '\\u003c') }}
        />
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Perspectives</p>
        <h1 className="mb-3 text-3xl font-bold text-foreground">How I think about enterprise AI</h1>
        <p className="mb-10 max-w-2xl text-muted-foreground">
          Short essays on the platform, operating-model, and governance decisions that decide whether AI reaches
          production — drawn from leading AI platform work at Krutrim, Ola, and HERE.
        </p>
        <ul className="space-y-4">
          {PERSPECTIVES.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/perspectives/${article.slug}`}
                className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-indigo-500/40"
              >
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {article.section} · {article.readMinutes} min read
                </p>
                <h2 className="mb-2 text-lg font-semibold text-foreground">{article.title}</h2>
                <p className="text-sm text-muted-foreground">{article.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
