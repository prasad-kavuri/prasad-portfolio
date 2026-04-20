import { demos } from './demos';

export type LegacyHtmlRedirect = {
  source: string;
  destination: string;
};

const DEMO_SLUGS = new Set(demos.map((demo) => demo.id));

// Explicit source→destination mapping for renamed legacy pages.
export const LEGACY_HTML_REDIRECTS: LegacyHtmlRedirect[] = [
  { source: '/portfolio-assistant.html', destination: '/demos/portfolio-assistant' },
  { source: '/vector-search-playground.html', destination: '/demos/vector-search' },
  { source: '/multimodal-assistant.html', destination: '/demos/multimodal' },
  { source: '/multi-agent-demo.html', destination: '/demos/multi-agent' },
  { source: '/rag-pipeline.html', destination: '/demos/rag-pipeline' },
  { source: '/vector-search.html', destination: '/demos/vector-search' },
  { source: '/quantization.html', destination: '/demos/quantization' },
  { source: '/llm-router.html', destination: '/demos/llm-router' },
  { source: '/multi-agent.html', destination: '/demos/multi-agent' },
  { source: '/mcp-demo.html', destination: '/demos/mcp-demo' },
  { source: '/resume-generator.html', destination: '/demos/resume-generator' },
  { source: '/enterprise-control-plane.html', destination: '/demos/enterprise-control-plane' },
  { source: '/world-generation.html', destination: '/demos/world-generation' },

  // Legacy .html variants that may have been generated under /demos.
  { source: '/demos/portfolio-assistant.html', destination: '/demos/portfolio-assistant' },
  { source: '/demos/vector-search-playground.html', destination: '/demos/vector-search' },
  { source: '/demos/multimodal-assistant.html', destination: '/demos/multimodal' },
  { source: '/demos/multi-agent-demo.html', destination: '/demos/multi-agent' },
  { source: '/demos/rag-pipeline.html', destination: '/demos/rag-pipeline' },
  { source: '/demos/vector-search.html', destination: '/demos/vector-search' },
  { source: '/demos/quantization.html', destination: '/demos/quantization' },
  { source: '/demos/llm-router.html', destination: '/demos/llm-router' },
  { source: '/demos/multi-agent.html', destination: '/demos/multi-agent' },
  { source: '/demos/mcp-demo.html', destination: '/demos/mcp-demo' },
  { source: '/demos/resume-generator.html', destination: '/demos/resume-generator' },
  { source: '/demos/enterprise-control-plane.html', destination: '/demos/enterprise-control-plane' },
  { source: '/demos/world-generation.html', destination: '/demos/world-generation' },
] as const;

const LEGACY_HTML_REDIRECT_MAP = new Map(
  LEGACY_HTML_REDIRECTS.map(({ source, destination }) => [source, destination])
);

export function resolveLegacyHtmlPath(pathname: string): string | null {
  if (!pathname.endsWith('.html') || pathname.startsWith('/_next/')) {
    return null;
  }

  const normalizedPath = pathname.toLowerCase();
  const explicit = LEGACY_HTML_REDIRECT_MAP.get(normalizedPath);
  if (explicit) {
    return explicit;
  }

  const normalizedSlug = normalizedPath.slice(normalizedPath.lastIndexOf('/') + 1, -'.html'.length);
  if (DEMO_SLUGS.has(normalizedSlug)) {
    return `/demos/${normalizedSlug}`;
  }

  return '/demos';
}
