import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
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
