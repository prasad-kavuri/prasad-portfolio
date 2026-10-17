/**
 * Single source of truth for the Content Security Policy (SPEC-0027, stage 1).
 *
 * Single source of truth for both policies. `src/proxy.ts` is the only place that sends them, chosen per route;
 * `next.config.ts` sends no CSP, so a route can never receive two different policies.
 * Keep this file dependency-free.
 * Changing a directive here changes the policy on every route; see SPEC-0027 before narrowing anything.
 */

/**
 * The only CDN location the browser demos may load the ONNX Runtime Web files from (SPEC-0027 stage 3).
 * Hugging Face Transformers builds exactly this address from its pinned onnxruntime-web version, so the CSP
 * allows that one package path and version instead of the whole CDN. A test fails when the installed
 * onnxruntime-web version changes, so this constant cannot silently go stale.
 */
export const ORT_WEB_VERSION = '1.31.0-dev.20260914-8d85527a0';
export const ORT_WASM_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_WEB_VERSION}/dist/`;

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
      ORT_WASM_BASE,
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
      // cdn.hf.co: model files now redirect to us.aws.cdn.hf.co (observed 2026-10-17); without it every
      // in-browser model download is blocked and the three WASM demos fall back to their simulated mode
      'https://*.cdn.hf.co',
      ORT_WASM_BASE,
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

/**
 * Stage 2: a stricter policy for every page except the three that run WebAssembly models in the browser.
 * It drops 'unsafe-eval', 'wasm-unsafe-eval', blob:, the two CDN script origins and the model-hosting
 * connect-src entries. 'unsafe-inline' stays for Next.js inline bootstrap scripts until stage 4.
 * Server-side calls (for example to api.groq.com) are not governed by the browser's connect-src.
 */
export const STRICT_CSP_DIRECTIVES: typeof CSP_DIRECTIVES = [
  ['default-src', ["'self'"]],
  ['script-src', ["'self'", "'unsafe-inline'", 'https://va.vercel-scripts.com']],
  ['worker-src', ["'self'"]],
  ['style-src', ["'self'", "'unsafe-inline'"]],
  ['img-src', ["'self'", 'data:', 'blob:', 'https:']],
  ['connect-src', ["'self'", 'https://va.vercel-scripts.com']],
  ['font-src', ["'self'", 'data:']],
  ['frame-ancestors', ["'none'"]],
  ['base-uri', ["'self'"]],
  ['form-action', ["'self'"]],
  ['object-src', ["'none'"]],
  ['upgrade-insecure-requests', []],
];

/** Pages that load Transformers.js / ONNX Runtime Web and therefore keep the full policy. */
export const FULL_CSP_ROUTES = [
  '/demos/rag-pipeline',
  '/demos/quantization',
  '/demos/edge-agent-collaboration',
] as const;

export type CspTier = 'full' | 'strict';

export function cspTierFor(pathname: string): CspTier {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return FULL_CSP_ROUTES.some((route) => path === route || path.startsWith(`${route}/`)) ? 'full' : 'strict';
}

export function buildCsp(directives: typeof CSP_DIRECTIVES = CSP_DIRECTIVES): string {
  return directives.map(([name, sources]) => [name, ...sources].join(' ')).join('; ');
}

export const CONTENT_SECURITY_POLICY = buildCsp();
export const STRICT_CONTENT_SECURITY_POLICY = buildCsp(STRICT_CSP_DIRECTIVES);

export function cspForPath(pathname: string): string {
  return cspTierFor(pathname) === 'full' ? CONTENT_SECURITY_POLICY : STRICT_CONTENT_SECURITY_POLICY;
}
