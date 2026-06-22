# ADR-0003: CSP and WASM headers are set in both next.config.ts AND src/proxy.ts

**Status**: Accepted  
**Date**: 2026-06

## Context

The four browser demos (RAG Pipeline, Vector Search, Quantization, Multimodal) require `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, and specific `Content-Security-Policy` directives (`blob:`, `wasm-unsafe-eval`) to enable SharedArrayBuffer and WebAssembly. These headers must be present on every response for those pages.

## Decision

COOP/COEP headers and the CSP are defined in **both** `next.config.ts` (applied at build time by Next.js) and `src/proxy.ts` (the edge middleware, applied at runtime). Both locations must stay in sync.

## Alternatives considered

- **Only `next.config.ts`**: Simpler. Rejected because edge middleware can override headers set at build time; without middleware alignment, redirects and rewrites strip the WASM headers, silently breaking all 4 browser demos.
- **Only edge middleware**: Rejected because Next.js's own streaming responses bypass middleware in some Vercel edge cases, causing intermittent COEP failures.
- **`vercel.json` headers**: Previously used. Rejected after a `vercel.json` overwrite broke all 4 browser demos by stripping `blob:` from the CSP — the failure was silent and hard to diagnose.

## Consequences

- **Never touch** `next.config.ts` CSP or `src/proxy.ts` headers without updating both files simultaneously.
- Any PR that changes one must change both — this is called out explicitly in CLAUDE.md.
- Adding a new `connect-src` or `script-src` directive requires changes in two places.
