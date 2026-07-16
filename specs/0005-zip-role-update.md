# SPEC-0005: Zip role update across portfolio

**Status**: In Progress
**Date**: 2026-07-16

## What

Update the portfolio site and repo to reflect the new role: Director, AI Platform & Agentic Solutions at Zip (started July 2026), and close out Krutrim (Head of AI Engineering, March 2025 - June 2026) as past experience. This mirrors the LinkedIn profile update already completed and verified (headline, About section, experience entries, skills reorder).

## Why

User has joined Zip as Director, AI Platform & Agentic Solutions and has already updated LinkedIn to reflect this, following a reviewed and finalized positioning (see conversation history — three rounds of review converged on final headline, About copy, and a single mandate-only Zip experience entry with no fabricated accomplishments). The portfolio is the user's primary public executive-positioning surface and needs to stay consistent with LinkedIn, both for human reviewers (recruiters, executives) and for AI/LLM crawlers that index `llms.txt`, `entity.json`, JSON-LD, and `ai-agent-manifest.json`.

User confirmed scope explicitly: full update now, matching LinkedIn's restraint (no fabricated Zip accomplishments, mandate-only description, same confidentiality caution — no internal Zip product names, architecture, or roadmap details).

## Scope boundaries

- In scope:
  - `src/data/profile.json` as source of truth: `personal.title`, `personal.subtitle`, `personal.summary`, new `experience[0]` entry for Zip, Krutrim `period` end date fix, `knowledgeBase` array updates, `skills.core` reorder to match LinkedIn (Agentic AI, AI Platforms, AI Governance-style ordering).
  - All files that hardcode "VP / Head of AI Engineering" or treat Krutrim as the current role independently of `profile.json` — found via repo-wide grep: `layout.tsx`, `about/page.tsx`, `Hero.tsx`, `api/context/route.ts`, `ai-profile.json/route.ts`, `entity.json`, `llms.txt`, `llms-full.txt`, `resume.md`, `resume.json`, `ai-agent-manifest.json`, `AgentContext.tsx`, `CopyForAI.tsx`, `executive-metrics.ts`, `Contact.tsx`, `CaseStudies.tsx`, `Experience.tsx`, `AIArchitecture.tsx`, `Testimonials.tsx`, per-page `opengraph-image.tsx` files, `docs/KNOWLEDGE_GRAPH_ANCHORING.md`.
  - Same content restraint as the LinkedIn update: single mandate sentence for Zip, no internal Zip product names/architecture/roadmap, "regulated financial-services environment" not "AI-native financial infrastructure" (unmatched to Zip's approved external language).
- Out of scope (this pass):
  - Test file assertions (`src/__tests__/**`) that hardcode the old title/company as fixture data — flagged as a required follow-up since `npm run test` must pass before commit, but fixing every assertion is a distinct, mechanical pass done after the content change lands so failures can be seen and fixed against real diffs rather than guessed blind.
  - Résumé PDF (`Prasad_Kavuri_Resume.pdf` / `prasad-kavuri-vp-ai-engineering-2026.pdf`) — binary asset, needs to be regenerated/replaced separately, not editable via this pass; flagged as a follow-up.
  - Any new case-study content, accomplishment bullets, or narrative depth about Zip work — none exists yet (2 weeks in), consistent with the LinkedIn "no fabricated accomplishments" rule.
  - CSP, security headers, rate limits, auth, demo registry entries — untouched.

## Evidence to reuse

- The finalized LinkedIn copy from this conversation (headline, About section, Zip experience entry, Krutrim end date) is the canonical source text — ported here, not re-derived.
- `src/data/profile.json` is already the single source of truth consumed by `Hero.tsx`, `api/context/route.ts`, `ai-profile.json/route.ts` — extend this pattern rather than duplicating content further.

## Open questions / [NEEDS CLARIFICATION]

- Résumé PDF filename references "vp-ai-engineering-2026" — regenerating that file is out of scope here but the filename embedded in links (`Navbar.tsx`, `resume-download` route) should be checked once a new PDF exists.

## Verification

- `npx tsc --noEmit`
- `npx eslint` on all changed files
- `node -e "JSON.parse(require('fs').readFileSync('public/entity.json','utf8'))"` and same for `public/.well-known/ai-agent-manifest.json`, `public/resume.json`
- `npm run build` (isolated copy, per prior precedent in this repo — `.next` is permission-locked in this environment)
- `npm run test` — expected to surface stale fixture assertions in `src/__tests__/**`; documented as follow-up, not blocking this spec's core deliverable
