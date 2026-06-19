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
        'AI engineering executive with 20+ years building production AI platforms at scale. Led 200+ engineers across platform strategy, AI governance, AI FinOps, and production AI operations, with $10M+ revenue impact and 70% cost reduction.',
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
      '@id': krutrimId,
      name: 'Krutrim',
      url: 'https://olakrutrim.com/',
      sameAs: ['https://www.linkedin.com/company/krutrim'],
      description: 'AI computing company where Prasad Kavuri serves as Head of AI Engineering.',
      employee: { '@id': personId },
    },
    // Flagship demo artifacts — connect proof to the Person entity
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-evaluation-showcase`,
      name: 'AI Evaluation Showcase',
      description: 'Production LLM-as-Judge evaluation pipeline with drift detection, HITL checkpoints, and eval-gated CI. Demonstrates executive-grade AI quality governance.',
      url: `${SITE_URL}/demos/evaluation-showcase`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'LLM evaluation, drift monitoring, HITL, AI governance, eval-gated CI',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-multi-agent`,
      name: 'Multi-Agent Orchestration System',
      description: 'Agentic orchestration with Analyzer, Researcher, and Strategist agents. Demonstrates multi-agent coordination, tool calling, and human-in-the-loop control patterns.',
      url: `${SITE_URL}/demos/multi-agent`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'multi-agent systems, agentic AI orchestration, LLM tool calling, HITL',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-enterprise-control-plane`,
      name: 'Enterprise AI Control Plane',
      description: 'Executive-level AI operations dashboard: token cost tracking, model routing analytics, observability, and governance posture across a simulated enterprise AI platform.',
      url: `${SITE_URL}/demos/enterprise-control-plane`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'AI FinOps, LLM cost optimization, AI observability, enterprise AI platform, LLMOps',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-llm-router`,
      name: 'LLM Router',
      description: 'Intelligent LLM routing system that selects the optimal model per request based on complexity, cost, and latency targets. Production pattern behind 70% cost reduction.',
      url: `${SITE_URL}/demos/llm-router`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'LLM routing, AI cost optimization, model selection, AI FinOps, inference efficiency',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-rag-pipeline`,
      name: 'RAG Pipeline',
      description: 'Real retrieval-augmented generation with Transformers.js embeddings running entirely in-browser via WASM. Demonstrates grounded enterprise knowledge retrieval with source traceability.',
      url: `${SITE_URL}/demos/rag-pipeline`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'RAG, retrieval-augmented generation, Transformers.js, vector embeddings, browser WASM',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-vector-search`,
      name: 'Vector Search',
      description: 'Semantic search with real sentence-BERT embeddings and UMAP visualisation. Enables natural-language retrieval across enterprise content systems.',
      url: `${SITE_URL}/demos/vector-search`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'vector search, semantic search, sentence-BERT, UMAP, cosine similarity',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-mcp-demo`,
      name: 'MCP Tool Demo',
      description: 'Model Context Protocol in action — LLM discovers and calls tools via JSON-RPC to answer questions. Demonstrates standardized agent-to-tool integration patterns.',
      url: `${SITE_URL}/demos/mcp-demo`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'MCP, Model Context Protocol, tool use, JSON-RPC, agent tool calling',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-portfolio-assistant`,
      name: 'AI Portfolio Assistant',
      description: 'Streaming full-context assistant over professional experience with optional retrieval-enhanced grounding and cited context cues.',
      url: `${SITE_URL}/demos/portfolio-assistant`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'AI assistant, streaming LLM, RAG, conversational AI, Vercel AI SDK',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-resume-generator`,
      name: 'AI Hiring Intelligence',
      description: 'JD-to-resume fit scoring with HITL-gated tailoring and ATS-optimized output. Demonstrates LLM orchestration on a measurable business workflow.',
      url: `${SITE_URL}/demos/resume-generator`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'AI resume, job description parsing, HITL, candidate fit scoring, ATS optimization',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-multimodal`,
      name: 'Multimodal Assistant',
      description: 'Florence-2 image captioning and OCR running in-browser via WebGPU and Transformers.js — zero server cost, privacy-preserving edge inference.',
      url: `${SITE_URL}/demos/multimodal`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'Florence-2, WebGPU, multimodal AI, image captioning, browser inference',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-quantization`,
      name: 'Model Quantization',
      description: 'Live ONNX benchmark comparing INT8 vs FP32 inference — real file sizes, latency, and quality delta. Demonstrates 70%+ memory reduction with minimal quality loss.',
      url: `${SITE_URL}/demos/quantization`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'ONNX, quantization, INT8, FP32, model compression, inference optimization',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-browser-native-ai-skill`,
      name: 'Native Browser AI Skill',
      description: 'Chrome AI Skill using on-device Gemini Nano for accessibility auditing — zero latency, 100% privacy, edge inference pattern for regulated enterprise tooling.',
      url: `${SITE_URL}/demos/browser-native-ai-skill`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'Gemini Nano, Chrome AI, on-device inference, edge AI, accessibility, WASM',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-edge-agent-collaboration`,
      name: 'Edge Agent + Cloud Agent Collaboration',
      description: 'Three-tier privacy-first AI pipeline: BERT NER redacts PII in-browser, HITL gate governs handoff, Groq produces executive summary from sanitized payload only.',
      url: `${SITE_URL}/demos/edge-agent-collaboration`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'edge AI, privacy-first AI, BERT NER, PII redaction, HITL, sovereign AI, agentic handoff',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-agent-auth`,
      name: 'Agent Auth Demo',
      description: 'Live auth.md protocol implementation — AI agents register anonymously, claim with email+OTP, then call MCP tools with Bearer credentials.',
      url: `${SITE_URL}/demos/agent-auth`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'auth.md, agent identity, OAuth, MCP, Bearer token, agent authentication',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#demo-world-generation`,
      name: 'Real-Time Spatial AI + World Modeling Engine',
      description: 'Perception → reconstruction → agent reasoning. LLM-powered spatial query layer with parametric scene refinement via natural-language instructions.',
      url: `${SITE_URL}/demos/world-generation`,
      applicationCategory: 'AIApplication',
      author: { '@id': personId },
      keywords: 'spatial AI, world generation, Three.js, LLM spatial reasoning, physical AI, simulation',
    },
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
    default: 'Prasad Kavuri — VP / Head of AI Engineering',
    template: '%s | Prasad Kavuri',
  },
  description:
    'Production AI platform portfolio for VP/Head-level evaluation: agentic orchestration, governance, retrieval systems, reliability controls, and enterprise AI operating rigor. Built India\'s first agentic AI platform (Kruti.ai), 300-seat call center automation, 70% cost reduction across 13K+ enterprise customers.',
  keywords: [
    'AI Engineering',
    'Agentic AI',
    'LLM Orchestration',
    'RAG Pipeline',
    'Multi-Agent Systems',
    'Head of AI Engineering',
    'VP of AI Engineering',
    'Chief AI Officer',
    'CAIO',
    'Head of LLM Engineering',
    'GenAI Leader',
    'AI Platform Lead',
    'Director of Machine Learning',
    'AI Executive',
    'Krutrim',
    'Kruti.ai',
    'Prasad Kavuri',
    'Machine Learning',
    'GenAI',
    'Vector Search',
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
    'Browser WASM Inference',
    'Edge AI',
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
