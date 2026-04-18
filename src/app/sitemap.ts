import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.prasadkavuri.com';
  const now = new Date();

  const demos = [
    'evaluation-showcase', 'rag-pipeline', 'llm-router', 'vector-search',
    'browser-native-ai-skill', 'multi-agent', 'mcp-demo',
    'enterprise-control-plane', 'world-generation', 'portfolio-assistant',
    'resume-generator', 'multimodal', 'quantization',
  ];

  const perspectives = [
    'why-enterprise-ai-stalls',
    'agentic-ai-changes-how-work-gets-done',
    'real-work-in-production-ai',
  ];

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/for-recruiters`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/governance`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/status`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    // Machine-readable resources for AI agents and LLM crawlers
    { url: `${base}/resume.md`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/llms.txt`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/.well-known/ai-agent-manifest.json`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...demos.map(slug => ({
      url: `${base}/demos/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...perspectives.map(slug => ({
      url: `${base}/perspectives/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
