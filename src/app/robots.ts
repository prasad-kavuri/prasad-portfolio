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

// Paths an agent working for a recruiter or hiring team needs. Every group must allow
// them, including the default one, otherwise robots-respecting agents cannot fetch the
// resume or reach the MCP and A2A endpoints that llms.txt and the agent card advertise.
const AGENT_REACHABLE_PATHS = [
  '/api/context',
  '/api/mcp',
  '/api/a2a',
  '/api/resume-download',
  '/api/mcp-demo',
  '/api/security/red-team',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', ...AGENT_REACHABLE_PATHS],
        disallow: ['/api/', '/*.html'],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ['/', ...AGENT_REACHABLE_PATHS],
        disallow: ['/api/'],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
