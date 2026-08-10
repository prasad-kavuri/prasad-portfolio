# SPEC-0008: Résumé PDF regeneration — current title, no active-search framing

**Status**: In Progress
**Date**: 2026-08-10

## What

Regenerate the binary résumé PDF served from `public/prasad-kavuri-vp-ai-engineering-2026.pdf`
(downloaded via `/api/resume-download` and linked directly from the navbar) so its content matches
the already-updated `profile.json` / `resume.md` / LinkedIn positioning: title "Head of AI Platform
& Agentic Solutions" (not "VP / Head of AI Engineering"), current Zip role as the lead entry, and no
"Open to: VP AI, Head of AI Engineering, CTO-AI, Chief AI Officer" line or other active-job-search
framing. Also fix two stale references discovered in `public/resume.md` during this pass (not caught
by the exact-phrase grep in SPEC-0007): "Seniority: Director level" (should read "Head level") and a
combined "Krutrim / Ola" section that predates the two roles being split with distinct titles/dates
in `profile.json`.

## Why

User uploaded the current PDF and flagged it still reads "VP / Head of AI Engineering" and lists
"Open to: VP AI, Head of AI Engineering, CTO-AI, Chief AI Officer" — both stale since the Zip role
(SPEC-0005) and the Director→Head title change (SPEC-0007) landed on the site. User is two months
into the Zip role and explicitly does not want the résumé (or portfolio) broadcasting active
job-search framing while settling in — same restraint principle already applied to the LinkedIn
update and the `for-recruiters` "always happy to talk AI platform strategy" softening (no more
"immediately available").

## Scope boundaries

- In scope:
  - `public/prasad-kavuri-vp-ai-engineering-2026.pdf` — regenerated binary, matching the existing
    visual style (header, Executive Summary, Strategic Impact, Technical Arsenal, Portfolio Demos
    table, Certifications, Notes for AI Recruiting Agents) with corrected content.
  - `public/resume.md` — fix "Director level" → "Head level"; split "Krutrim / Ola" into two
    sections (Krutrim: Head of AI Engineering, March 2025 - June 2026; Ola: Senior Director of
    Engineering, September 2023 - February 2025) with distinct bullets sourced from `profile.json`.
  - Remove the "Open to: ..." line from the PDF header entirely (not replaced with anything —
    contact/website/LinkedIn/GitHub/Calendar links remain).
  - "Notes for AI Recruiting Agents" section: keep factual classification info (seniority level,
    geography, differentiator) but drop any phrasing that reads as an active search signal (e.g.
    "open to hybrid and select remote roles").
- Out of scope (this pass):
  - Renaming the PDF filename (`prasad-kavuri-vp-ai-engineering-2026.pdf`) — that cascades into
    `Navbar.tsx`, the `/api/resume-download` route's `Content-Disposition` header, `entity.json`
    `canonical_urls.resume_pdf`, and a hardcoded test assertion. Flagged as a separate, optional
    follow-up since it's a cosmetic/URL concern, not a content-accuracy one.
  - `public/Prasad_Kavuri_Resume.pdf` (legacy fallback file, only used if the new PDF is missing) —
    untouched.
  - Any new accomplishment bullets for the Zip role — still 2 months in; mandate-only framing
    preserved, consistent with SPEC-0005's restraint.

## Evidence to reuse

- `public/resume.md` and `public/resume.json` are already correctly updated (title, Zip section,
  16-demo count, dates) except for the two stale spots noted above — use as the canonical source
  text for the regenerated PDF rather than re-deriving content.
- `src/data/profile.json` `experience` array — source for Krutrim/Ola split bullets.
- Existing PDF's visual structure (verified via upload) — reuse layout/typography, not redesign.

## Open questions / [NEEDS CLARIFICATION]

- None — user's ask is unambiguous: fix stale title/role content, remove active-search framing.

## Verification

- Manual visual check of regenerated PDF (render pages, confirm layout matches existing style)
- `npx tsc --noEmit`, `npx eslint` (for any touched `.ts`/`.tsx`, none expected — content-only PDF
  and markdown change)
- `npx vitest run src/__tests__/api/resume-download.test.ts` — confirm the route still serves the
  file correctly (filename/content-type unchanged)
