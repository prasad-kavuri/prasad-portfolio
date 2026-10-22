import type { NextConfig } from "next";
import { LEGACY_HTML_REDIRECTS, RETIRED_DEMO_REDIRECTS } from "./src/data/legacy-routes";

const nextConfig: NextConfig = {
  turbopack: {},
  async redirects() {
    return [
      ...LEGACY_HTML_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
      ...RETIRED_DEMO_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
      // Catch-all: any /demos/*.html not covered above → /demos
      { source: '/demos/:path*.html', destination: '/demos', permanent: true },
      // Catch-all: any root-level legacy .html slug not covered above → /demos
      { source: '/:path*.html', destination: '/demos', permanent: true },
      // /resume is the first URL people and agents try; send it to the resume PDF route.
      { source: '/resume', destination: '/api/resume-download', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        // Prevent Google from continuing to index the stale legacy PDF filename.
        source: "/Prasad_Kavuri_Resume.pdf",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        // RFC 9116: security.txt must be text/plain. It was being served as application/json.
        source: "/.well-known/security.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
      {
        // Advertise llms.txt to AI crawlers that discover it via HTTP Link headers
        // Applied to homepage, canonical profile, and recruiter entry point
        source: "/",
        headers: [
          { key: "Link", value: '<https://www.prasadkavuri.com/llms.txt>; rel="ai-content", <https://www.prasadkavuri.com/api/context>; rel="agent-context"' },
        ],
      },
      {
        source: "/about",
        headers: [
          { key: "Link", value: '<https://www.prasadkavuri.com/llms.txt>; rel="ai-content"' },
        ],
      },
      {
        source: "/for-recruiters",
        headers: [
          { key: "Link", value: '<https://www.prasadkavuri.com/llms.txt>; rel="ai-content"' },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          // Content-Security-Policy is set per route in src/proxy.ts (SPEC-0027 stage 2).
          // Required for SharedArrayBuffer (used by WASM multi-threading)
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // credentialless required: HuggingFace CDN does not send CORP headers;
          // require-corp blocks cross-origin model weight fetches on desktop Chrome
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          // Belt-and-suspenders hardening headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()" },
          // HSTS: enforce HTTPS for 2 years, include subdomains, eligible for preload list
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
