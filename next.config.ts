import type { NextConfig } from "next";

// Explicit source→destination mapping so old URLs with different names
// (e.g. multimodal-assistant → multimodal) land on the right page.
const LEGACY_HTML_PAGES: Array<{ source: string; destination: string }> = [
  { source: '/portfolio-assistant.html',      destination: '/demos/portfolio-assistant' },
  { source: '/vector-search-playground.html', destination: '/demos/vector-search' },
  { source: '/multimodal-assistant.html',     destination: '/demos/multimodal' },
  { source: '/multi-agent-demo.html',         destination: '/demos/multi-agent' },
  { source: '/rag-pipeline.html',             destination: '/demos/rag-pipeline' },
  { source: '/vector-search.html',            destination: '/demos/vector-search' },
  { source: '/quantization.html',             destination: '/demos/quantization' },
  { source: '/llm-router.html',               destination: '/demos/llm-router' },
  { source: '/multi-agent.html',              destination: '/demos/multi-agent' },
  { source: '/mcp-demo.html',                 destination: '/demos/mcp-demo' },
  { source: '/resume-generator.html',         destination: '/demos/resume-generator' },
];

const nextConfig: NextConfig = {
  turbopack: {},
  async redirects() {
    return LEGACY_HTML_PAGES.map(({ source, destination }) => ({
      source,
      destination,
      permanent: true, // 308 — signals final redirect to Google
    }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // blob: required for Transformers.js WASM worker bootstrap
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://va.vercel-scripts.com",
              // worker-src blob: required for WASM web workers spun up by @xenova/transformers
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              // huggingface.co for model weights; blob: for local object-URL fetches
              "connect-src 'self' https://huggingface.co https://*.huggingface.co https://cdn-lfs.huggingface.co blob: https://api.groq.com https://*.hf.space https://va.vercel-scripts.com",
              "font-src 'self' data:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          // Required for SharedArrayBuffer (used by WASM multi-threading)
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          // Belt-and-suspenders hardening headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
