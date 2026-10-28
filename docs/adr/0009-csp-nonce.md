# ADR-0009: Route-specific CSP; inline-script hardening deferred

**Status**: Accepted; reconciled with shipped policy on 2026-10-28
**Original date**: 2026-06

## Context

Next.js bootstrap scripts and browser inference demos have different runtime
requirements. SPEC-0027 stages 1-3 centralized CSP and narrowed its exceptions;
stage 4 (removing script-src 'unsafe-inline') remains a separate proposed trial.

## Current decision

- `src/lib/csp.ts` builds both policies. `src/proxy.ts` selects and sends CSP
  per route. `next.config.ts` does not send CSP; other security headers,
  including COOP/COEP, still have both delivery locations (ADR-0003).
- Both policy tiers currently allow `'unsafe-inline'` in script-src and
  style-src. This is production behavior, not a development-only exception.
- The stricter tier excludes `'unsafe-eval'`, `'wasm-unsafe-eval'`, blob:
  scripts/workers, and model/CDN connection sources. The internal name
  "strict" identifies a relative policy tier, not a nonce/hash-based strict CSP.
- Only `/demos/rag-pipeline`, `/demos/quantization`, and
  `/demos/edge-agent-collaboration` (and their subpaths) receive the full tier.
  Its script sources retain the WASM/eval/blob exceptions and the pinned
  ONNX Runtime Web package path. Model downloads have explicit connect sources.
- No inline-script nonce or hash allowlist is implemented. JSON-LD is data,
  not evidence that bootstrap scripts are protected by hashes.

## Alternatives and next step

Nonce-based and build-generated hash approaches remain candidates for the
SPEC-0027 stage 4 compatibility trial. This ADR does not claim that Vercel or
Next.js makes nonces impossible, or that either approach is already shipped.
Rendering, caching, build support and browser-demo compatibility must be checked
against the installed framework before choosing an implementation.

## Consequences

The policy still restricts external script sources, framing, forms and other
resources, but `'unsafe-inline'` leaves an important inline-script protection
gap. It must not be described as complete XSS prevention or hash-based CSP.
Do not remove exceptions without the staged trial and explicit approval.

Change CSP directives in `src/lib/csp.ts`, not in two delivery points. Keep
non-CSP security headers synchronized where required by ADR-0003. Validate
changes with the CSP tests, browser demos and post-deployment verifier.

## History

The original June text incorrectly described hash-based protection and called
unsafe-inline development-only. The 2026-10-12 correction acknowledged those
errors, but its site-wide/dual-CSP description was superseded by stages 1-3.
This revision replaces both conflicting descriptions with the current decision;
SPEC-0027 retains the staged implementation history.
