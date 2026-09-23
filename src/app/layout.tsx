import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PORTFOLIO_FACTS, SITE_NAME, SITE_URL } from '@/data/site-config';
import { demos } from '@/data/demos';
import './globals.css';

const personId = `${SITE_URL}/#person`;
const websiteId = `${SITE_URL}/#website`;
const zipId = `${SITE_URL}/#organization-zip`;
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
      jobTitle: 'Head of AI Platform & Agentic Solutions',
      description:
        'AI platform executive with 20+ years building production AI platforms at scale. Leads AI Platform and Agentic Solutions at Zip, in a regulated financial-services environment. Previously led 200+ engineers across platform strategy, AI governance, AI FinOps, and production AI operations at Krutrim and Ola.',
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
        SITE_URL,
      ],
      significantLink: [
        `${SITE_URL}/about`,
        `${SITE_URL}/entity.json`,
        `${SITE_URL}/resume.md`,
        `${SITE_URL}/.well-known/ai-agent-manifest.json`,
        `${SITE_URL}/llms.txt`,
      ],
      worksFor: { '@id': zipId },
      alumniOf: [
        {
          '@type': 'CollegeOrUniversity',
          name: 'Northern Illinois University',
        },
        {
          '@type': 'CollegeOrUniversity',
          name: 'Osmania University',
        },
        { '@id': krutrimId },
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
        // Exact parity with ai-agent-manifest.json core_capabilities
        'Agentic AI Orchestration',
        'LLM Routing & Cost Optimization',
        'AI Governance & HITL Systems',
        'RAG Pipelines & Vector Search',
        'Drift Monitoring & Eval Gating',
        'AI FinOps',
        'Enterprise Platform Engineering',
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
      hasCredential: [
        { '@type': 'EducationalOccupationalCredential', name: 'Introduction to subagents', recognizedBy: { '@type': 'Organization', name: 'Anthropic' }, dateCreated: 'Mar 2026' },
        { '@type': 'EducationalOccupationalCredential', name: 'Building with the Claude API', recognizedBy: { '@type': 'Organization', name: 'Anthropic' }, dateCreated: 'Mar 2026' },
        { '@type': 'EducationalOccupationalCredential', name: 'Claude Code in Action', recognizedBy: { '@type': 'Organization', name: 'Anthropic' }, dateCreated: 'Mar 2026' },
        { '@type': 'EducationalOccupationalCredential', name: 'Introduction to Model Context Protocol', recognizedBy: { '@type': 'Organization', name: 'Anthropic' }, dateCreated: 'Feb 2026' },
        { '@type': 'EducationalOccupationalCredential', name: 'Claude 101', recognizedBy: { '@type': 'Organization', name: 'Anthropic' }, dateCreated: 'Feb 2026' },
        { '@type': 'EducationalOccupationalCredential', name: 'AI Fluency Framework & Foundations', recognizedBy: { '@type': 'Organization', name: 'Anthropic' }, dateCreated: 'Feb 2026' },
        { '@type': 'EducationalOccupationalCredential', name: 'Agentic AI', recognizedBy: { '@type': 'Organization', name: 'DeepLearning.AI' }, dateCreated: 'Nov 2025' },
        { '@type': 'EducationalOccupationalCredential', name: 'Event-Driven Agentic Document Workflows', recognizedBy: { '@type': 'Organization', name: 'DeepLearning.AI' }, dateCreated: 'Jul 2025' },
        { '@type': 'EducationalOccupationalCredential', name: 'Generative AI Leader Certification', recognizedBy: { '@type': 'Organization', name: 'Google' }, dateCreated: 'Mar 2026' },
        { '@type': 'EducationalOccupationalCredential', name: 'Agentic AI and AI Agents: A Primer for Leaders', recognizedBy: { '@type': 'Organization', name: 'Vanderbilt University' }, dateCreated: 'Feb 2025' },
      ],
    },
    {
      '@type': 'Organization',
      '@id': zipId,
      name: 'Zip',
      sameAs: [],
      description: 'Enterprise financial services platform where Prasad Kavuri serves as Head of AI Platform & Agentic Solutions.',
      employee: { '@id': personId },
    },
    {
      '@type': 'Organization',
      '@id': krutrimId,
      name: 'Krutrim',
      url: 'https://olakrutrim.com/',
      sameAs: ['https://www.linkedin.com/company/krutrim'],
      description: 'AI computing company where Prasad Kavuri previously served as Head of AI Engineering (March 2025 - June 2026).',
      alumni: { '@id': personId },
    },
    // Demo artifacts — generated from the demo registry (src/data/demos.ts) so structured data can
    // never drift from the gallery. Descriptions and tags are the registry's own, verified copy.
    ...demos.map((demo) => ({
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-${demo.id}`,
      name: demo.title,
      description: demo.description,
      url: `${SITE_URL}${demo.href}`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: demo.tags.join(', '),
    })),
    // Key portfolio pages discoverable by agents
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/recruiter-dashboard#webpage`,
      url: `${SITE_URL}/recruiter-dashboard`,
      name: 'Recruiter Dashboard — Prasad Kavuri',
      description: 'Tabbed recruiter brief: role fit analysis, skills map, evidence by category, and interview path guidance for VP/Head AI Engineering evaluation.',
      isPartOf: { '@id': websiteId },
      about: { '@id': personId },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', 'h2', '[data-speakable]'] },
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/agent-marketplace#webpage`,
      url: `${SITE_URL}/agent-marketplace`,
      name: 'Agent Marketplace — Prasad Kavuri',
      description: `${PORTFOLIO_FACTS.productionDemoCount} production AI agents across agentic orchestration, governance, inference, browser AI, and enterprise control — all on shared platform infrastructure.`,
      isPartOf: { '@id': websiteId },
      about: { '@id': personId },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Prasad Kavuri — Head of AI Platform & Agentic Solutions',
    template: '%s | Prasad Kavuri',
  },
  description:
    'AI platform executive portfolio: enterprise agentic AI platforms, governance, evaluation, and AI operating rigor. Currently Head of AI Platform & Agentic Solutions at Zip. Previously built India\'s first agentic AI platform (Kruti.ai) at Krutrim and delivered a 70% infrastructure cost reduction at Ola across 13K+ enterprise customers.',
  keywords: [
    'AI Engineering',
    'Agentic AI',
    'LLM Orchestration',
    'RAG Pipeline',
    'Multi-Agent Systems',
    'Head of AI Platform',
    'Head of AI Engineering',
    'VP of AI Engineering',
    'Chief AI Officer',
    'CAIO',
    'Head of LLM Engineering',
    'GenAI Leader',
    'AI Platform Lead',
    'AI Executive',
    'Zip',
    'Krutrim',
    'Kruti.ai',
    'Prasad Kavuri',
    'Machine Learning',
    'GenAI',
    'LLMOps',
    'MLOps',
    'AI Governance',
    'AI FinOps',
    'Model Context Protocol',
    'MCP',
    'HITL',
    'Human in the Loop',
    'Eval-gated CI',
    'Drift Monitoring',
    'Enterprise AI Platform',
    'Agentic AI Platform',
    'India AI',
    'Call Center Automation',
    'LLM Cost Reduction',
    'AI Infrastructure',
    'Edge AI',
  ],
  authors: [{ name: 'Prasad Kavuri', url: SITE_URL }],
  creator: 'Prasad Kavuri',
  openGraph: {
    title: 'Prasad Kavuri — Head of AI Platform & Agentic Solutions | Chicago',
    description: `Head of AI Platform & Agentic Solutions at Zip. Previously built agentic AI platforms at Krutrim/Ola (${PORTFOLIO_FACTS.b2bCustomersEnabled} B2B customers, ${PORTFOLIO_FACTS.costReductionDelivered} cost reduction, ${PORTFOLIO_FACTS.latencyReduction} latency improvement).`,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Prasad Kavuri AI engineering portfolio' }],
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prasad Kavuri — Head of AI Platform & Agentic Solutions',
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
    canonical: SITE_URL,
    languages: {
      'en-US': SITE_URL,
      'x-default': SITE_URL,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} overflow-x-hidden`}>
      <head>
        {/* AI crawler discovery — HTML equivalent of the HTTP Link header on key pages */}
        <link rel="ai-content" href="https://www.prasadkavuri.com/llms.txt" />
      </head>
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
