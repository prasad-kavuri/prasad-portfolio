# SPEC-0009: Fix AI-crawler consistency and active-search-signal findings

**Status**: In Progress
**Date**: 2026-08-19

## What

Fix the three concrete gaps identified in the 2026-08-19 Agentic SEO & Recruitment Reachability Audit
(`portfolio-audit-agentic-seo-2026-08.md`): (1) `AgentContext.tsx`'s sr-only crawler-summary paragraph
still says "VP-level"; (2) `layout.tsx` Open Graph `description` still says "Director-level AI platform
executive at Zip"; (3) the homepage hero's "Available Now · Actively Evaluating Opportunities" banner
reads as active-job-search signaling, inconsistent with the restraint already applied to the résumé PDF
(SPEC-0008) and `for-recruiters` copy. Also renames the `vp-search-2026` UTM campaign tag used across
all Calendly links, since it's the same active-search framing baked into analytics.

## Why

The audit found that two prior title-update passes (SPEC-0005, SPEC-0007) used exact-phrase greps that
missed these three spots because the wording differed from the literal target phrase searched for.
`AgentContext.tsx` and the OG description are specifically the strings LLM crawlers and social-preview
scrapers read first when summarizing the page — leaving them stale actively contradicts the page's own
`<title>` and JSON-LD. The hero banner is the most visible surviving "actively job-hunting" signal on
the site, which the user has now twice (résumé, this audit) said should be softened while settling into
the Zip role. User confirmed via clarifying question: soften the banner to match the tone already used
on `/for-recruiters` ("always happy to talk AI platform strategy") rather than removing it outright or
leaving it unchanged.

## Scope boundaries

- In scope:
  - `src/components/AgentContext.tsx` — replace "VP-level Applied AI Engineering leader" with "Head of
    AI Platform & Agentic Solutions at Zip."
  - `src/app/layout.tsx` — `openGraph.description` "Director-level AI platform executive at Zip" →
    current title.
  - `src/components/sections/Hero.tsx` — reword the "Available Now · Actively Evaluating Opportunities"
    label to match the established softened tone ("Currently at Zip · Always Happy to Talk AI Platform
    Strategy"), keeping the technology-topic badges below it unchanged (they read fine under either
    framing).
  - `src/lib/tracking.ts` — rename `utm_campaign=vp-search-2026` → `utm_campaign=portfolio-2026` across
    all five `CALENDLY_URLS` entries.
  - `src/lib/analytics.ts` — matching `campaign: 'vp-search-2026'` → `'portfolio-2026'` in the tracked
    event payload.
  - Test fixtures asserting the old banner text or campaign string.
- Out of scope (this pass):
  - The root `<meta name="description">` "Director/VP-level evaluation" phrase — audience descriptor,
    not a title claim; flagged in the audit as worth revisiting only after the above fixes land, not
    bundled into this pass.
  - `npm audit` puppeteer finding and major dependency bumps (Next.js patch, TypeScript 7, ESLint 10) —
    audit explicitly flagged these as routine maintenance needing a dedicated branch/testing pass, not
    urgent, and not part of "fix the findings" in the sense of content/positioning consistency.
  - CSP, security headers, rate limits, auth — untouched.

## Evidence to reuse

- `portfolio-audit-agentic-seo-2026-08.md` — source of all three findings, written earlier this session.
- Existing softened-tone precedent: `for-recruiters/page.tsx` ("always happy to talk AI platform
  strategy"), `Contact.tsx`, `contact/page.tsx` — reuse this exact phrasing rather than inventing new
  copy, for consistency across surfaces.

## Open questions / [NEEDS CLARIFICATION]

- None — user confirmed via AskUserQuestion: soften the hero banner to match the for-recruiters tone.

## Verification

- `npx tsc --noEmit`
- `npx eslint` on all changed files
- `npx vitest run src/__tests__/components/Hero.test.tsx src/lib/__tests__/analytics.test.ts`
- `npm run build` (isolated copy, `.next` permission-locked in this environment)
