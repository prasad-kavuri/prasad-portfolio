# ADR-0009: CSP uses hash-based allowlisting for inline scripts, not nonces

**Status**: Accepted  
**Date**: 2026-06

## Context

The Content Security Policy must allow the JSON-LD `<script type="application/ld+json">`
tag in `layout.tsx`, the Next.js inline bootstrap scripts, and the WASM `wasm-unsafe-eval`
directive. There are two standard ways to allow inline scripts in a strict CSP: nonces
(per-request random values) or hashes (static SHA-256 of the script content).

## Decision

Inline scripts are allowed via a combination of:
1. `'unsafe-inline'` scoped only to specific trusted script sources where Next.js requires
   it (bootstrap chunks) — present in the development CSP.
2. JSON-LD `<script type="application/ld+json">` is allowed because `application/ld+json`
   is not a JavaScript MIME type — it is exempt from `script-src` by CSP specification.
3. `wasm-unsafe-eval` is present in `script-src` to allow WASM compilation in the four
   browser demos.

A nonce-based CSP was not implemented.

## Alternatives considered

- **Nonce-based CSP (`'nonce-{random}'`)**: Each request generates a cryptographic nonce
  injected into all trusted `<script>` tags and the CSP header simultaneously. Maximally
  strict. Rejected because Vercel Edge middleware and Next.js 16 App Router do not have
  a clean interception point to inject nonces into streamed HTML — the RSC streaming
  pipeline emits chunks before middleware can modify them, making consistent nonce
  injection unreliable without a custom server.
- **Hash-based CSP (SHA-256 of inline script content)**: The most strict option that works
  without a custom server. Partially implemented — JSON-LD is exempt by MIME type. Full
  hash-based allowlisting of Next.js bootstrap scripts was evaluated but Next.js 16's
  Turbopack rebuilds produce different bootstrap chunk hashes across builds, invalidating
  any hardcoded hash list on every deploy.
- **No inline script restriction (`'unsafe-inline'`)**: Simplest. Rejected because it
  removes all XSS protection from the script-src directive — unacceptable for a security-
  showcasing portfolio.

## Consequences

- The current CSP is **strict but not nonce-strict** — it is appropriate for a Vercel-
  hosted static/serverless deployment without a custom Node server.
- If a custom server is ever introduced, migrate to nonce-based CSP immediately.
- Any new inline `<script>` (not `application/ld+json`) added to the HTML must be
  externalized to a `.js` file in `/public` and loaded via `<script src="">` to remain
  CSP-compliant.
- CSP changes require updates in BOTH `next.config.ts` AND `src/proxy.ts` — see ADR-0003.
- Validate CSP after any change: use `https://csp-evaluator.withgoogle.com`.
