/**
 * Single source of truth for the Content Security Policy (SPEC-0027, stage 1).
 *
 * `next.config.ts` and `src/proxy.ts` both send this exact string, so the two delivery points cannot drift.
 * This file must stay dependency-free and use relative imports only: `next.config.ts` loads it directly.
 * Changing a directive here changes the policy on every route; see SPEC-0027 before narrowing anything.
 */

export const CSP_DIRECTIVES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['default-src', ["'self'"]],
  [
    'script-src',
    [
      "'self'",
      // unsafe-eval: WASM JIT compilation (Transformers.js / ONNX Runtime Web)
      "'unsafe-eval'",
      "'wasm-unsafe-eval'",
      "'unsafe-inline'",
      // blob: Transformers.js WASM worker bootstrap
      'blob:',
      'https://va.vercel-scripts.com',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
    ],
  ],
  // worker-src blob: WASM web workers spun up by the Transformers.js runtime
  ['worker-src', ["'self'", 'blob:']],
  ['style-src', ["'self'", "'unsafe-inline'"]],
  ['img-src', ["'self'", 'data:', 'blob:', 'https:']],
  [
    'connect-src',
    [
      "'self'",
      // huggingface.co: model weights; api.groq.com: server demo calls; blob: local object-URL fetches
      'https://api.groq.com',
      'https://huggingface.co',
      'https://*.huggingface.co',
      'https://cdn-lfs.huggingface.co',
      'https://cdn-lfs-us-1.huggingface.co',
      // xethub.hf.co: Hugging Face migrated its model CDN to XetHub (2025)
      'https://xethub.hf.co',
      'https://*.xethub.hf.co',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://va.vercel-scripts.com',
      'blob:',
    ],
  ],
  ['font-src', ["'self'", 'data:']],
  ['frame-ancestors', ["'none'"]],
  ['base-uri', ["'self'"]],
  ['form-action', ["'self'"]],
  ['object-src', ["'none'"]],
  ['upgrade-insecure-requests', []],
];

export function buildCsp(directives: typeof CSP_DIRECTIVES = CSP_DIRECTIVES): string {
  return directives.map(([name, sources]) => [name, ...sources].join(' ')).join('; ');
}

export const CONTENT_SECURITY_POLICY = buildCsp();
