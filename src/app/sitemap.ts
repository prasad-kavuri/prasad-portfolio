import { MetadataRoute } from 'next';
import { demos } from '@/data/demos';
import { SITE_URL } from '@/data/site-config';

const FLAGSHIP_DEMO_ID = 'evaluation-showcase';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const perspectives = [
    'why-enterprise-ai-stalls',
    'agentic-ai-changes-how-work-gets-done',
    'real-work-in-production-ai',
  ];

  return [
    // Tier 1 — homepage
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },

    // Tier 2 — primary recruiter/contact page
    { url: `${SITE_URL}/for-recruiters`, lastModified: now, changeFrequency: 'monthly', priority: 0.95 },

    // Tier 3 — high-value hub pages + machine-readable AI entry points
    { url: `${SITE_URL}/governance`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/demos`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/agent`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${SITE_URL}/ai-profile.json`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },

    // Supporting pages
    { url: `${SITE_URL}/capabilities`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/certifications`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Machine-readable resources for AI agents and LLM crawlers
    { url: `${SITE_URL}/resume.md`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/llms.txt`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/.well-known/ai-agent-manifest.json`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Tier 4 — individual demo pages (derived dynamically from demos.ts, never hardcoded)
    // Flagship demo gets priority 0.9; all others 0.8
    ...demos.map((demo) => ({
      url: `${SITE_URL}${demo.href}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: demo.id === FLAGSHIP_DEMO_ID ? 0.9 : 0.8,
    })),

    // Tier 5 — perspectives / long-form content
    ...perspectives.map((slug) => ({
      url: `${SITE_URL}/perspectives/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),

    // Tier 6 — utility
    { url: `${SITE_URL}/status`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
