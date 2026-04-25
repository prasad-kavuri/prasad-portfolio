import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PORTFOLIO_FACTS, SITE_NAME, SITE_URL } from '@/data/site-config';
import './globals.css';

const personId = `${SITE_URL}/#person`;
const websiteId = `${SITE_URL}/#website`;
const krutrimId = `${SITE_URL}/#organization-krutrim`;

const siteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: 'Prasad Kavuri',
      url: SITE_URL,
      publisher: { '@id': personId },
      inLanguage: 'en-US',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/demos?query={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Person',
      '@id': personId,
      name: 'Prasad Kavuri',
      jobTitle: 'VP / Head of AI Engineering',
      description:
        'AI engineering executive with 20+ years building production AI platforms at scale. Led 200+ engineers, delivered $10M+ revenue impact, 70% cost reduction through LLM governance, multi-agent systems, and shared AI infrastructure.',
      url: SITE_URL,
      mainEntityOfPage: SITE_URL,
      email: 'vbkpkavuri@gmail.com',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'professional',
        email: 'vbkpkavuri@gmail.com',
        url: 'https://www.linkedin.com/in/pkavuri/',
      },
      image: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/profile-photo.jpg`,
        width: 400,
        height: 400,
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Naperville',
        addressRegion: 'IL',
        addressCountry: 'US',
      },
      sameAs: [
        'https://www.linkedin.com/in/pkavuri/',
        'https://github.com/prasad-kavuri',
      ],
      significantLink: [`${SITE_URL}/resume.md`, `${SITE_URL}/.well-known/ai-agent-manifest.json`, `${SITE_URL}/llms.txt`],
      worksFor: { '@id': krutrimId },
      alumniOf: [
        {
          '@type': 'CollegeOrUniversity',
          name: 'Northern Illinois University',
        },
        {
          '@type': 'CollegeOrUniversity',
          name: 'Osmania University',
        },
      ],
      knowsAbout: [
        'Agentic AI',
        'LLM Orchestration',
        'RAG Pipelines',
        'Enterprise AI',
        'AI Platform Architecture',
        'Multi-Agent Systems',
        'AI Governance',
        'LLMOps',
        'FinOps',
        'Evaluation Frameworks',
        'MCP Protocol',
        'Production AI Infrastructure',
        'Drift Monitoring',
        'HITL Checkpoints',
        'Global Engineering Leadership',
      ],
      hasOccupation: {
        '@type': 'Occupation',
        name: 'AI Engineering Executive',
        occupationLocation: {
          '@type': 'Country',
          name: 'United States',
        },
        skills: ['AI platform architecture', 'LLM orchestration', 'RAG pipelines', 'Global engineering leadership'],
      },
    },
    {
      '@type': 'Organization',
      '@id': krutrimId,
      name: 'Krutrim',
      url: 'https://olakrutrim.com/',
      sameAs: ['https://www.linkedin.com/company/krutrim'],
      description: 'AI computing company where Prasad Kavuri serves as Head of AI Engineering.',
      employee: { '@id': personId },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Prasad Kavuri — VP / Head of AI Engineering',
    template: '%s | Prasad Kavuri',
  },
  description:
    'Production AI platform portfolio for VP/Head-level evaluation: agentic orchestration, governance, retrieval systems, reliability controls, and enterprise AI operating rigor.',
  keywords: [
    'AI Engineering',
    'Agentic AI',
    'LLM Orchestration',
    'RAG Pipeline',
    'Multi-Agent Systems',
    'Head of AI Engineering',
    'AI Executive',
    'Krutrim',
    'Kruti.ai',
    'Prasad Kavuri',
    'Machine Learning',
    'GenAI',
    'Vector Search',
    'LLMOps',
    'MLOps',
  ],
  authors: [{ name: 'Prasad Kavuri', url: SITE_URL }],
  creator: 'Prasad Kavuri',
  openGraph: {
    title: 'Prasad Kavuri — VP / Head of AI Engineering | Chicago',
    description: `VP-level AI engineering executive. Built agentic AI platforms at Krutrim/Ola (${PORTFOLIO_FACTS.b2bCustomersEnabled} B2B customers, ${PORTFOLIO_FACTS.costReductionDelivered} cost reduction, ${PORTFOLIO_FACTS.latencyReduction} latency improvement).`,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Prasad Kavuri AI engineering portfolio' }],
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prasad Kavuri — VP / Head of AI Engineering',
    description: `Enterprise AI platform leadership: agentic orchestration, governance, evaluation, and reliability with ${PORTFOLIO_FACTS.productionDemoCount} production demos.`,
    images: ['/og-image.jpg'],
    creator: '@prasadkavuri',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(siteStructuredData).replace(/</g, '\\u003c'),
            }}
          />
          {children}
          <footer className="border-t border-border py-3 px-6">
            <a
              href="/governance"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span
                style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', flexShrink: 0 }}
              />
              AI Platform Status: Operational
            </a>
          </footer>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
