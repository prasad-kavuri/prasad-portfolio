import type { NextConfig } from "next";
import { LEGACY_HTML_REDIRECTS } from "./src/data/legacy-routes";

const nextConfig: NextConfig = {
  turbopack: {},
  async redirects() {
    return [
      ...LEGACY_HTML_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
      // Catch-all: any /demos/*.html not covered above → /demos
      { source: '/demos/:path*.html', destination: '/demos', permanent: true },
      // Catch-all: any root-level legacy .html slug not covered above → /demos
      { source: '/:path*.html', destination: '/demos', permanent: true },
    ];
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
              // unsafe-eval required for WASM JIT compilation (Transformers.js / ONNX Runtime Web)
              // blob: required for Transformers.js WASM worker bootstrap
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://va.vercel-scripts.com",
              // worker-src blob: required for WASM web workers spun up by @xenova/transformers
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              // huggingface.co for model weights; api.groq.com for server demo calls; blob: for local object-URL fetches
              "connect-src 'self' https://api.groq.com https://huggingface.co https://*.huggingface.co https://cdn-lfs.huggingface.co https://cdn.jsdelivr.net https://unpkg.com https://va.vercel-scripts.com blob:",
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
