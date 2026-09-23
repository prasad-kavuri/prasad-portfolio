import { demos } from './demos';

export type LegacyHtmlRedirect = {
  source: string;
  destination: string;
};

const DEMO_SLUGS = new Set(demos.map((demo) => demo.id));

// Explicit source→destination mapping for renamed legacy pages.
export const LEGACY_HTML_REDIRECTS: LegacyHtmlRedirect[] = [
  { source: '/portfolio-assistant.html', destination: '/demos/portfolio-assistant' },
  { source: '/vector-search-playground.html', destination: '/demos/rag-pipeline' },
  { source: '/multimodal-assistant.html', destination: '/demos/edge-agent-collaboration' },
  { source: '/multi-agent-demo.html', destination: '/demos/multi-agent' },
  { source: '/rag-pipeline.html', destination: '/demos/rag-pipeline' },
  { source: '/vector-search.html', destination: '/demos/rag-pipeline' },
  { source: '/quantization.html', destination: '/demos/quantization' },
  { source: '/llm-router.html', destination: '/demos/llm-router' },
  { source: '/multi-agent.html', destination: '/demos/multi-agent' },
  { source: '/mcp-demo.html', destination: '/demos/mcp-demo' },
  { source: '/resume-generator.html', destination: '/about' },
  { source: '/enterprise-control-plane.html', destination: '/demos/enterprise-control-plane' },
  { source: '/world-generation.html', destination: '/demos/world-generation' },

  // Legacy .html variants that may have been generated under /demos.
  { source: '/demos/portfolio-assistant.html', destination: '/demos/portfolio-assistant' },
  { source: '/demos/vector-search-playground.html', destination: '/demos/rag-pipeline' },
  { source: '/demos/multimodal-assistant.html', destination: '/demos/edge-agent-collaboration' },
  { source: '/demos/multi-agent-demo.html', destination: '/demos/multi-agent' },
  { source: '/demos/rag-pipeline.html', destination: '/demos/rag-pipeline' },
  { source: '/demos/vector-search.html', destination: '/demos/rag-pipeline' },
  { source: '/demos/quantization.html', destination: '/demos/quantization' },
  { source: '/demos/llm-router.html', destination: '/demos/llm-router' },
  { source: '/demos/multi-agent.html', destination: '/demos/multi-agent' },
  { source: '/demos/mcp-demo.html', destination: '/demos/mcp-demo' },
  { source: '/demos/resume-generator.html', destination: '/about' },
  { source: '/demos/enterprise-control-plane.html', destination: '/demos/enterprise-control-plane' },
  { source: '/demos/world-generation.html', destination: '/demos/world-generation' },
] as const;

// Demos retired in SPEC-0019 (Phase 0 consolidation). Permanent redirects keep old links and
// search equity pointing at the closest surviving experience.
export const RETIRED_DEMO_REDIRECTS: LegacyHtmlRedirect[] = [
  { source: '/demos/vector-search', destination: '/demos/rag-pipeline' },
  { source: '/demos/multimodal', destination: '/demos/edge-agent-collaboration' },
  { source: '/demos/browser-native-ai-skill', destination: '/demos' },
  { source: '/demos/resume-generator', destination: '/about' },
];

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
