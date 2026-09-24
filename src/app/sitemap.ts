import { MetadataRoute } from 'next';
import { demos } from '@/data/demos';
import { SITE_URL } from '@/data/site-config';
import { PERSPECTIVES } from '@/data/perspectives';

const FLAGSHIP_DEMO_ID = 'governed-agent-platform';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const perspectives = PERSPECTIVES.map((article) => article.slug);

  return [
    // Tier 1 — homepage
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },

    // Tier 2 — primary recruiter/contact page
    { url: `${SITE_URL}/for-recruiters`, lastModified: now, changeFrequency: 'monthly', priority: 0.95 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.95 },

    // Tier 3 — high-value hub pages + machine-readable AI entry points
    { url: `${SITE_URL}/governance`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/enterprise-ai-operating-model`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${SITE_URL}/demos`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/agent`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${SITE_URL}/recruiter-dashboard`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/agent-marketplace`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${SITE_URL}/ai-profile.json`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },

    // Supporting pages
    { url: `${SITE_URL}/capabilities`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/ai-runtime-engineering`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/ai-finops`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/enterprise-agent-runtime`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/adaptive-ai-governance`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/agent-readiness`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/skills`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/certifications`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${SITE_URL}/testimonials`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Machine-readable resources for AI agents and LLM crawlers
    { url: `${SITE_URL}/resume.md`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/llms.txt`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/llms-full.txt`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/entity.json`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/.well-known/ai-agent-manifest.json`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/auth.md`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/.well-known/oauth-protected-resource`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // Note: /api/context is intentionally NOT listed here — robots.txt disallows /api/ for the
    // default crawler group, and only submitting URLs that are actually crawlable to a sitemap
    // avoids Google Search Console's "Submitted URL blocked by robots.txt" warning. AI crawlers
    // that need it already have an explicit robots.txt Allow override and reach it via llms.txt.
    // (/.well-known/ is not under robots.txt's /api/ disallow, so these two are fine to list.)

    // Tier 4 — individual demo pages (derived dynamically from demos.ts, never hardcoded)
    // Flagship demo gets priority 0.9; all others 0.8
    ...demos.map((demo) => ({
      url: `${SITE_URL}${demo.href}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: demo.id === FLAGSHIP_DEMO_ID ? 0.9 : 0.8,
    })),

    // Tier 5 — perspectives / long-form thought leadership content
    { url: `${SITE_URL}/perspectives`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    ...perspectives.map((slug) => ({
      url: `${SITE_URL}/perspectives/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),

    // Tier 6 — utility
    { url: `${SITE_URL}/status`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
