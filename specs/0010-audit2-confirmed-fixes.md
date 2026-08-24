# SPEC-0010: Fix confirmed findings from ChatGPT's Agentic SEO audit

**Status**: In Progress
**Date**: 2026-08-19

## What

Fix three findings from a second (ChatGPT-authored) Agentic SEO & Recruitment Reachability Audit that
were independently verified against actual source: (1) a "14 layers" vs "15 layers" architecture-count
contradiction spanning `AIArchitecture.tsx` itself plus `llms.txt` and `ai-agent-manifest.json`; (2) a
stale `period: "March 2025 – Present"` for Krutrim in `CaseStudies.tsx`'s "Selected Leadership Impact"
section — a different component than the `Experience.tsx` timeline already corrected in SPEC-0005; (3)
a duplicate "Download Resume" CTA rendered twice in `Hero.tsx`.

## Why

Verified each claim directly against source before acting (per this project's practice of not trusting
external audits blindly): the layer-count file has 15 layer objects (`num: '01'`–`'15'`, including an
"Adaptive AI Governance" layer at position 06) and its own footer text says "All 15 layers are live,"
while its intro paragraph says "traverses 14 layers" — an internal self-contradiction, not just a
cross-file one. `llms-full.txt` already correctly says "15-layer," confirming the other three files
(the file itself, `llms.txt`, `ai-agent-manifest.json`) are what drifted, likely from when the Adaptive
AI Governance layer was added (SPEC-0001) without a full sweep of layer-count references. The
`CaseStudies.tsx` finding is a genuine, currently-live employment-chronology contradiction (Krutrim
ended June 2026 per `profile.json`; this component still implies it's ongoing) that a recruiter or
LLM crawler could misread as overlapping employment with Zip. The duplicate CTA is a minor, low-risk
UX cleanup confirmed by direct line inspection.

## Scope boundaries

- In scope:
  - `src/components/sections/AIArchitecture.tsx` — "traverses 14 layers" → "15 layers."
  - `public/llms.txt` — both "14-layer" occurrences → "15-layer."
  - `public/.well-known/ai-agent-manifest.json` — "14-layer" → "15-layer," and insert "Adaptive AI
    Governance" into the arrow-chain description between "model router" and "inference" so the listed
    steps actually total 15.
  - `src/components/sections/CaseStudies.tsx` — Krutrim `period` → `"March 2025 – June 2026"`.
  - `src/components/sections/Hero.tsx` — remove the second (secondary-row) "Download Resume" link,
    keep the primary-CTA-row one; secondary row becomes purely external/contact links (LinkedIn,
    GitHub, email, Copy for AI).
- Out of scope (this pass): everything else in the ChatGPT audit not independently confirmed or
  explicitly deprioritized in the prior turn (canonical-data-model rewrite, CSP route-splitting, CORS
  wildcard — confirmed to be a Vercel platform default, not a configured header — email-exposure
  framing, Hero server/client component split).

## Evidence to reuse

- Confirmed via direct `grep`/`Read` against: `AIArchitecture.tsx` (lines 46–187 layer array, 313,
  369), `public/llms.txt` (lines 46, 139), `public/llms-full.txt` (line 383, already correct),
  `public/.well-known/ai-agent-manifest.json` (line 129), `CaseStudies.tsx` (lines 19–21), `Hero.tsx`
  (lines 176–221).
- `src/__tests__/components/Hero.test.tsx` already uses `getAllByRole(...).find(...)` for the resume
  link assertions, not an exact-count check — confirmed removing the duplicate won't break existing
  tests.

## Open questions / [NEEDS CLARIFICATION]

- None — all three fixes are corrections to verified factual/content errors, not judgment calls.

## Verification

- `npx tsc --noEmit`
- `npx eslint` on all changed files
- `node -e "JSON.parse(require('fs').readFileSync('public/.well-known/ai-agent-manifest.json','utf8'))"`
- `npx vitest run src/__tests__/components/Hero.test.tsx`
- `npm run build` (isolated copy, `.next` permission-locked in this environment)
