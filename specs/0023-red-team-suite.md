# SPEC-0023: Continuous red-team of the portfolio's own AI surfaces

**Status**: Implemented
**Date**: 2026-10-04

## What

A deterministic, model-free adversarial corpus (`src/lib/redteam/cases.ts`, run by
`src/lib/redteam/run.ts`) that attacks this portfolio's own AI defenses on every push and every
deploy, and publishes the result.

1. **Corpus** — 59 cases (47 attacks + 12 benign controls), each tagged with the OWASP Top 10 for
   LLM Applications (2025) and the OWASP Top 10 for Agentic Applications (2026) risks it exercises,
   across seven defense layers: input guard, tool-output screening, output sanitizer, tool gateway,
   agent policy, human approval, release gate. Techniques: direct and obfuscated prompt injection
   (zero-width, homoglyph, full-width, leetspeak, spacing, base64, multilingual), indirect injection
   through tool output, markup/XSS in model output, tool misuse and privilege abuse at the gateway,
   goal hijack and excessive agency in the payment agent, approval state-confusion / spoofing /
   replay, and an unsafe agent-version rollout. Benign controls hold the false-positive budget.
2. **Hardened guardrails** (`src/lib/guardrails.ts`) — `normalizeForDetection` expands an input into
   the plaintext variants that obfuscation hides (NFKC fold, zero-width strip, homoglyph map,
   de-spacing, de-leet, base64 decode) and `detectPromptInjection` scans all of them; added
   synonym/role/extraction signatures and Spanish/French/German injection signatures; screening of
   tool output inherits this automatically. `sanitizeLLMOutput` now also strips iframe/object/embed/
   svg/style/meta/base/form tags, unquoted event handlers, whitespace-split `javascript:`,
   `vbscript:`, and `data:text/html`.
3. **Agent policy** (`src/lib/flagship/payment-agent.ts`) — a high-risk vendor now requires human
   approval regardless of amount, so a poisoned record that evades screening still cannot auto-pay.
4. **CI gate** (`src/__tests__/security/red-team.test.ts`, `npm run test:redteam`, also in
   `test:coverage`) — fails the build on any regression (a newly missed attack) or any benign input
   newly flagged. Every known gap must name the backstop control that still prevents harm.
5. **Published results** — `/security/red-team` (human) and `/api/security/red-team` (JSON, in the
   AI-crawler allowlist), linked from the Platform nav and the sitemap.

## Baseline → hardened

The first run against the pre-existing guardrails blocked 23 of 47 attacks; 22 gaps were obfuscation
and multilingual injection, extra XSS vectors, and an under-threshold high-risk vendor. After
hardening: 45 of 47 blocked, 0 false positives, 0 unexpected results. The remaining two are semantic
attacks a pattern guard cannot catch; both are documented `known_gap` cases whose backstop is that
payment release is decided by deterministic policy and a credentialed human approval, never by text
in a request.

## Why

Phase 2 put real AI surface online (assistant, MCP server, A2A payment agent). Everything was tested
from the inside; nothing attacked it from the outside. For a VP AI Platform / CAIO audience,
"I red-team my own agent platform in CI and publish the results" is stronger evidence than another
demo. Prompted by the RedAmon project; this is the in-process, CI-friendly equivalent — no external
scan is run against production.

## Scope boundaries

- In scope: the corpus, guardrail/agent hardening for what it found, the CI gate, the results page
  and endpoint, docs.
- Out of scope: running an external offensive tool (e.g. RedAmon, garak) against a live deployment —
  that is a preview-only, authorized activity, not part of CI; LLM-graded attack generation (kept
  model-free so CI needs no keys and stays reproducible); any change to real auth or deployment
  config.
- Not a demo and not a skill: this is security evidence, deliberately kept out of the demo registry.

## Verification

`tsc --noEmit`, `eslint`, `vitest --coverage` (1178 tests, thresholds met), `next build`, and a local
`next start` smoke of `/security/red-team`, `/api/security/red-team`, robots and sitemap entries.
