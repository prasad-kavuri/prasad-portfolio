import { fileURLToPath } from 'node:url';

const mode = process.env.CSP_FIXTURE_MODE;
if (!['sri', 'nonce'].includes(mode)) throw new Error('Set CSP_FIXTURE_MODE to sri or nonce for this isolated fixture');
const nonceMode = mode === 'nonce';

const nextConfig = {
  distDir: 'node_modules/.cache/next',
  turbopack: { root: fileURLToPath(new URL('../../../', import.meta.url)) },
  experimental: nonceMode ? {} : { sri: { algorithm: 'sha256' } },
  async headers() {
    return nonceMode ? [] : [{
      source: '/:path*',
      headers: [{ key: 'Content-Security-Policy', value: "script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'" }],
    }];
  },
};

export default nextConfig;
