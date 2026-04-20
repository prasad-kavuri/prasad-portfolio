import { MetadataRoute } from 'next';
import { demos } from '@/data/demos';
import { SITE_URL } from '@/data/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const perspectives = [
    'why-enterprise-ai-stalls',
    'agentic-ai-changes-how-work-gets-done',
    'real-work-in-production-ai',
  ];

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/for-recruiters`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/demos`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/governance`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/status`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    // Machine-readable resources for AI agents and LLM crawlers
    { url: `${SITE_URL}/resume.md`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/llms.txt`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/.well-known/ai-agent-manifest.json`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...demos.map((demo) => ({
      url: `${SITE_URL}${demo.href}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...perspectives.map((slug) => ({
      url: `${SITE_URL}/perspectives/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
