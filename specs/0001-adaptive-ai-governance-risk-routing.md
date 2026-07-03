# SPEC-0001: Adaptive AI Governance — runtime risk classification and risk-aware routing

**Status**: Implemented
**Date**: 2026-07-03

> Note: this spec is backfilled — written after implementation, as the first example of the
> `specs/` convention adopted in this same session. Future specs should be written before implementation.

## What

A real runtime risk classifier that sits between the model router and the model itself: every request
is classified into a risk tier (standard / security-sensitive / regulated / blocked) before a model is
selected, and routed differently depending on tier. Not a narrative page describing governance in the
abstract — a working classifier with a live demo.

## Why

An external review of the portfolio (a ChatGPT-generated architecture prompt) correctly identified that
existing governance content (`/governance`) described static, point-in-time controls, while the model
router (`llm-routing.ts`) only optimized for cost/complexity — there was no risk-aware routing at all.
Recent industry direction (Anthropic Managed Agents, adaptive governance patterns) made this gap visible
and worth closing for real, not just narratively.

## Scope boundaries

- In scope: a pure, deterministic risk classifier; live wiring into the existing LLM Router demo; one new
  executive page explaining it; inserting it as a real layer in the existing 15-layer architecture diagram.
- Out of scope (this pass): a standalone "Security Agent Runtime" (offensive/defensive security automation)
  — deferred as too easily misread as security tooling without more careful, narrow framing.

## Evidence to reuse

- `src/lib/guardrails.ts` — `detectPromptInjection` reused directly for the "blocked" tier, rather than
  reimplementing injection detection a second time.
- `src/app/demos/llm-router/page.tsx` — existing routing UI extended with a Runtime Governance panel,
  rather than a new demo built from scratch.
- `src/components/sections/AIArchitecture.tsx` — existing 14-layer diagram extended to 15 layers, rather
  than a new diagram.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/lib/risk-classifier.ts src/app/demos/llm-router/page.tsx src/components/sections/AIArchitecture.tsx src/app/adaptive-ai-governance`
- `npx vitest run src/__tests__/lib/risk-classifier.test.ts src/__tests__/components/AdaptiveAIGovernancePage.test.tsx src/__tests__/components/AIArchitecture.test.tsx src/__tests__/components/LLMRouterPage.test.tsx`
- `npm run build` (isolated copy — `.next` in the mounted repo is permission-locked in this sandbox)
