# SPEC-0006: Industry reference — Uber ADR on /adaptive-ai-governance

**Status**: In Progress
**Date**: 2026-08-06

## What

Add a small "Industry Signal" callout to `/adaptive-ai-governance` that cites Uber's public ADR
("Agentic Detection and Response") project as an external reference point — runtime, EDR-style
detection for agentic AI (prompt injection, tool misuse, data exfiltration) validating the same
category of problem this page's runtime governance layer addresses. No new page, no new demo,
no claim that this platform implements ADR or anything ADR-shaped beyond what already exists.

## Why

Uber open-sourced ADR (repo: `github.com/uber/ADR`, paper: arXiv 2605.17380) — an agent telemetry
sensor + detection system for credential exposure, prompt injection, data exfiltration, and
policy-violating tool use in agentic AI systems. This is a credible, named-source validation that
"runtime security monitoring for agentic AI" is an emerging enterprise category — directly adjacent
to what `/adaptive-ai-governance` already claims (runtime risk classification, prompt injection
blocking, audit trail). Citing it strengthens the page's credibility for both human reviewers and
AI/LLM crawlers without requiring any new capability to be built.

## Scope boundaries

- In scope:
  - One new callout/section on `src/app/adaptive-ai-governance/page.tsx`, styled consistently with
    existing `Card` sections on the page, citing Uber ADR by name with an external link to the
    GitHub repo, framed as an industry parallel — not an integration or dependency.
  - Wording must be precise about what's cited (a paper + not-yet-released code) vs. what this
    platform does today (already covered accurately elsewhere on the page).
- Out of scope (this pass):
  - No new page, no new demo, no changes to `guardrails.ts` or `observability.ts`.
  - No claim that this platform "integrates with," "is built on," or "implements" ADR — ADR's code
    isn't public yet (repo currently ships only a README + paper link).
  - No changes to JSON-LD, `llms.txt`, `entity.json`, or other GEO files — confined to the one page.
  - No changes to CSP, security headers, rate limits, auth.

## Evidence to reuse

- Existing `Card` component and section styling already used on this page (see "Where this sits"
  and "Enforced today vs. the broader threat model" sections) — match that visual pattern rather
  than introducing a new one.
- Uber ADR repo (`https://github.com/uber/ADR`) and arXiv paper (`https://arxiv.org/abs/2605.17380`)
  as the cited source — confirmed via direct fetch on 2026-08-06 that only a README exists publicly;
  code is described as "coming soon."

## Open questions / [NEEDS CLARIFICATION]

- None — this is a small, additive, citation-only change with no ambiguity in scope.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/app/adaptive-ai-governance/page.tsx`
- Manual read-through confirming the wording doesn't overclaim integration with or use of ADR.
