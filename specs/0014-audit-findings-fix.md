# SPEC-0014: Fix findings from AI_Portfolio_Audit_Report.md

**Status**: Implemented
**Date**: 2026-09-15

## What

Fixes for the confirmed findings from the read-only audit (`AI_Portfolio_Audit_Report.md`):

1. **`src/app/recruiter-dashboard/page.tsx`** — removed the "Actively interviewing" badge (line 195,
   now "Currently at Zip") and reworded the "Compensation context" card (now "Engagement context") to
   drop "VP / Head level band" and "Equity participation expected" — both active-job-search claims
   that contradicted the currently-employed, softened positioning used everywhere else on the site
   (Hero banner, résumé). Kept the two factual track-record bullets ($8M–$20M budget ownership,
   board-ready governance posture).
2. **`public/.well-known/ai-agent-manifest.json`** — fixed `"layers_documented": 14` → `15` to match
   the adjacent `description` field on the same object (self-contradiction within one machine-readable
   file). Also added `"sovereign AI platform leader"` to `recruiter_query_match` so it matches
   `entity.json`'s list (was present there but missing here).
3. **`src/app/sitemap.ts`** — added `/recruiter-dashboard` (priority 0.9, matching its role as the
   primary AI-agent-facing recruiter surface) and `/agent-marketplace` (priority 0.85); removed
   `/api/context`, which was submitted in the sitemap while `robots.txt`'s default crawler group
   disallows all of `/api/` — the exact pattern Google Search Console flags as "Submitted URL blocked
   by robots.txt." AI crawlers that need `/api/context` already have an explicit `robots.txt` Allow
   override and are pointed at it via `llms.txt`, so removing it from the sitemap loses nothing for
   that audience.
4. **`SECURITY.md`** — corrected the CVE-2026-23864 mitigation section: the stated patched-baseline
   versions (`react@19.2.6`, `next@16.2.4`) were two patch releases stale versus the actual
   `package.json` (`react@^19.2.8`, `next@16.3.5`), and the claim "`react` and `react-dom` are pinned
   to exact version... (no `^` caret)" was factually false — `package.json` pins them with a caret
   range. Reworded to state the actual current versions and note that only `next` is exact-pinned;
   the caret range on React means this section should be re-checked on the next React bump. Verified
   the underlying exploitability claim (zero `"use server"` directives) still holds via
   `grep -r '"use server"' src` — no matches.

## Investigated but not changed

**`/agent-marketplace`'s stale live metadata** (old title "VP / Head of AI Engineering", no mention
of Zip, "15 production demos" in the Twitter description) — flagged as High impact in the audit.
Investigated the actual source: `src/app/agent-marketplace/page.tsx` is a client component
(`'use client'`) with no `generateMetadata`/`export const metadata` of its own, and no `layout.tsx`
exists in that route segment. A repo-wide grep for the exact stale strings observed live
("15 production demos", "VP-level AI engineering executive") returns zero matches anywhere in `src/`
or `public/`. This means the current source, if rebuilt, would correctly inherit the root
`layout.tsx`'s metadata (which is already current — "Head of AI Platform & Agentic Solutions"). There
is no source-level bug to fix here; the live staleness observed during the audit is a
static-generation/CDN caching artifact tied to an older deployment. Pushing this commit will trigger
a fresh Vercel deployment that should regenerate this page's static HTML from the current root
metadata. **Follow-up**: after deploying, re-fetch `https://www.prasadkavuri.com/agent-marketplace`
and confirm the title/description are current; if still stale, a manual "Redeploy" (not just a new
commit) or cache purge in the Vercel dashboard is the next step, since that would confirm it's a
cache-invalidation issue rather than something this audit missed.

## Deferred (requires a product decision, not fixed here)

- `/for-recruiters`'s "Recommended Path" doesn't link to `/recruiter-dashboard` at all (Pillar 2,
  Medium impact in the audit). Left unchanged — this is a navigation/IA decision (whether the two
  recruiter pages should be merged, cross-linked, or intentionally kept as separate audiences) rather
  than a factual bug, and changing it without that decision would be a drive-by restructure.
- Generating `entity.json`/`ai-agent-manifest.json`/route metadata from `src/data/profile.json` at
  build time, to prevent this whole class of drift recurring (audit Pillar 4, structural
  observation) — a larger architectural change, out of scope for a findings-fix pass.
- The résumé PDF filename (`prasad-kavuri-vp-ai-engineering-2026.pdf`) — unchanged, consistent with
  every prior pass this session; still requires coordinated changes across the Navbar, the API route's
  `Content-Disposition` header, `entity.json`, and tests.

## Verification

- `grep -rn "Actively interviewing\|Compensation context\|VP / Head level band\|Equity participation" src/` → no matches.
- `python3 -c "import json; json.load(open('public/.well-known/ai-agent-manifest.json'))"` → valid JSON, `layers_documented` is `15`.
- `src/__tests__/sitemap.test.ts` — no test asserts `/api/context`'s presence or an exact sitemap length, so the sitemap changes don't require test updates; re-ran to confirm.
- `npx tsc --noEmit`, `npm run lint`, full `vitest run`, `npm run build` — see chat for isolated-sandbox results.
