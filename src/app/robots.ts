import { MetadataRoute } from 'next';
import { SITE_URL } from '@/data/site-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/static/'],
    },
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      // Agent-specific entry points advertised as sitemaps for discovery
      `${SITE_URL}/llms.txt`,
    ],
  };
}
