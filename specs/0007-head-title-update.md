# SPEC-0007: Title update — Director → Head of AI Platform & Agentic Solutions

**Status**: In Progress
**Date**: 2026-08-09

## What

Swap the displayed title across the portfolio from "Director, AI Platform & Agentic Solutions" to
"Head of AI Platform & Agentic Solutions" (same scope wording, only the leading title word changes).
Applies everywhere the exact phrase (or its `&amp;`-escaped JSX equivalent) appears: `profile.json`
(source of truth), JSON-LD (`jobTitle` fields across `layout.tsx`, `about`, `contact`, `agent`,
`for-recruiters`, `enterprise-ai-operating-model`), page metadata/OpenGraph/Twitter titles, hero/about/
contact/recruiter-dashboard body copy, `opengraph-image.tsx` alt text and rendered images (13 files),
API route copy (`portfolio-assistant`, `ai-profile.json`, `context`), `CopyForAI.tsx`, GEO/crawler
files (`entity.json`, `llms.txt`, `llms-full.txt`, `resume.md`, `resume.json`,
`.well-known/ai-agent-manifest.json`), `docs/KNOWLEDGE_GRAPH_ANCHORING.md`, and the e2e smoke test.

Recruiter search-fit keyword lists (`layout.tsx` `keywords`, `Hero.tsx` search-fit terms) that already
list "Director of AI Platform" as one of several searchable title variants (alongside "Head of AI
Engineering", "VP of AI Engineering", "Senior Director AI Platform") are left as-is — they exist to
match however a recruiter searches, not to declare the current title — but "Head of AI Platform" is
added to both lists since it is now also literally true.

## Why

User is reconsidering "Director" vs. "Head" as the title on both LinkedIn and the portfolio. Rationale
given: "Head of AI Engineering" (the prior Krutrim title) reliably drew confidential inbound interest
from Senior Director- and VP-level roles; "Director" risks being read as a level below that and
narrowing the roles recruiters approach with. The user's pay stub does not list an official title,
so there is no compliance/HR constraint forcing "Director" — this is purely a positioning choice, and
the user has decided on "Head of AI Platform & Agentic Solutions." User will make the matching change
on LinkedIn separately; the portfolio should mirror it once done here, per the same consistency
principle used for the July 2026 Zip rollout (see `specs/0005-zip-role-update.md`).

## Scope boundaries

- In scope: every occurrence of the literal phrase "Director, AI Platform & Agentic Solutions" (and
  `&amp;`-escaped equivalent in JSX) across source, `public/`, and `docs/` — full list identified via
  repo-wide grep, see Evidence below. `src/data/profile.json` is the source-of-truth edit; the rest
  mirror it, consistent with the existing pattern where many pages still hardcode title text
  independently rather than importing from `profile.json`.
- Out of scope (this pass):
  - Recruiter search-fit keyword/term lists that intentionally list multiple title variants
    ("Director of AI Platform", "Senior Director AI Platform", etc.) as searchable synonyms — these
    are additive, not replaced; "Head of AI Platform" is added alongside them.
  - `recruiter-dashboard/page.tsx`'s `ROLE_DIMENSIONS` labels like "Director / VP / Head of AI
    Engineering" and "Sr. Director, AI Platform" — these describe target-role buckets being scored,
    not Prasad's own title, and are unaffected by this change except where the rationale text itself
    states "currently Director, AI Platform & Agentic Solutions at Zip."
  - `specs/0005-zip-role-update.md` and `portfolio-audit-v3-2026.md` — historical records of a prior
    change, not live guidance; left untouched so the change history stays accurate to what was true
    at the time.
  - Test fixtures in `src/__tests__/**` that hardcode the old title string as mock data — fixed in a
    dedicated pass once the real-file changes are in, so failures are visible against real diffs.
  - LinkedIn — user is updating that separately.

## Evidence to reuse

- Full file list from `grep -rln "Director, AI Platform"` across the repo (35 non-test source/content
  files + 6 test files + 2 historical docs correctly excluded) — see prior grep output in this
  conversation for the authoritative list.
- Precedent: `specs/0005-zip-role-update.md` used the same "source of truth + dependent files" pattern
  for the July 2026 Zip title/role rollout.

## Open questions / [NEEDS CLARIFICATION]

- None — user confirmed exact wording ("Head of AI Platform & Agentic Solutions") and rollout approach
  (full swap now, not staged on a branch) via clarifying question before this spec was written.

## Verification

- `npx tsc --noEmit`
- `npx eslint` on all changed files
- `node -e "JSON.parse(require('fs').readFileSync('public/entity.json','utf8'))"` and same for
  `public/.well-known/ai-agent-manifest.json`, `public/resume.json`
- `npm run build` (isolated copy, `.next` is permission-locked in this environment)
- `npm run test` — expect stale fixture assertions in `src/__tests__/**` referencing "Director,
  AI Platform & Agentic Solutions"; fixed as a follow-up pass against real failures
