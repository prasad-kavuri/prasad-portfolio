const BASE = 'https://www.prasadkavuri.com';

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generates a BreadcrumbList JSON-LD string for a page.
 * Always prepends Home → and accepts additional items in order.
 *
 * Usage:
 *   breadcrumbJsonLd([
 *     { name: 'Demos', url: '/demos' },
 *     { name: 'LLM Router', url: '/demos/llm-router' },
 *   ])
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]): string {
  const allItems = [{ name: 'Home', url: '/' }, ...items];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE}${item.url}`,
    })),
  }).replace(/</g, '\\u003c');
}
