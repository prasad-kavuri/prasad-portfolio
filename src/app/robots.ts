import { MetadataRoute } from 'next';
import { SITE_URL } from '@/data/site-config';

const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Amazonbot',
  'cohere-ai',
  'Applebot-Extended',
  'meta-externalagent',
  'Meta-ExternalFetcher',
  'Bytespider',
  'YouBot',
  'CCBot',
  'Diffbot',
  'LinkedInBot',
  'Slurp',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/*.html'],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ['/', '/api/context', '/api/mcp-demo'],
        disallow: ['/api/'],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
