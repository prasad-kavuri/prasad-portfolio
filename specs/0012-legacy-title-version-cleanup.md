# SPEC-0012: Legacy title/version cleanup in AGENTS.md, README.md, AI-AGENT.md, recruiter-review skill

**Status**: Implemented
**Date**: 2026-09-14

## What

Fix stale references discovered while auditing CLAUDE.md for drift (SPEC-0011/Task 57 follow-on),
confirmed with the user before fixing since it exceeded the originally-approved scope:

- `AGENTS.md`: "Next.js 16.2.6" (line 87) → "16.3.1"; "`next` is pinned to exact `16.2.6`" (line 205)
  → "16.3.1"; `profile.personal.title` = "VP / Head of AI Engineering" (line 206) → "Head of AI
  Platform & Agentic Solutions".
- `README.md`: title line 1, About line 24, and "Currently exploring..." line 35 all still said "VP
  / Head of AI Engineering" — the oldest title, pre-dating even the July 2026 "Director, AI Platform
  & Agentic Solutions" rollout. Updated to "Head of AI Platform & Agentic Solutions (at Zip)". Removed
  the active-job-search framing ("Currently exploring... roles — Chicago area & remote") to match the
  softened positioning already shipped in SPEC-0008 (resume) and SPEC-0009 (Hero banner) — replaced
  with a neutral "Chicago area & remote" location line, no availability claim. Same fix for the footer
  line 87. Also corrected "14 live demos" (line 5, byline) to "16 live demos" — same class of numeric
  drift as the 14/15-layer bug fixed in SPEC-0010, caught incidentally while editing the same line.
- `AI-AGENT.md`: Identity block "VP / Head of AI Engineering" (line 10) → "Head of AI Platform &
  Agentic Solutions (at Zip)"; "Open to VP / Head of AI Engineering and AI Platform Leadership roles"
  (line 12) → "Currently at Zip" (matches the Hero banner language from SPEC-0009 — no active-search
  claim on a public AI-agent-facing identity file).
- `skills/recruiter-review/SKILL.md`: "VP / Head of AI Engineering" target-role references (lines 58,
  59, 69) → "Head of AI Platform & Agentic Solutions" to match current canonical title.

## Why

User confirmed via AskUserQuestion ("Yes, fix all of it") after I surfaced these as a scope expansion
beyond the already-approved CONTEXT.md/YAML-frontmatter fixes. These files reference the oldest title
in the portfolio's history and, in README.md/AI-AGENT.md, contradict the explicit softened-positioning
decision made earlier this session (user chose "Leave as-is" on Gemini's suggestion to reintroduce
active target-role messaging).

## Scope boundaries

- In scope: the specific lines identified above in the 4 named files.
- Out of scope: historical/dated snapshot files intentionally left untouched all session —
  `AI_Portfolio_Audit_Report.md`, `specs/0005-zip-role-update.md`, `specs/0008-resume-pdf-regeneration.md`,
  `linkedin-article-week3.md`, `portfolio-audit-v3-2026.md`, `portfolio-audit-agentic-seo-2026-08.md`.
- Out of scope: `skills/prasad-portfolio/SKILL.md`'s own internal "16.2.6"/"React 19.2.6"/title lines —
  not part of what was surfaced/approved in this round; flagged as a possible future follow-up.

## Verification

- `grep -rn "VP / Head of AI Engineering\|16\.2\.6" AGENTS.md README.md AI-AGENT.md skills/recruiter-review/SKILL.md`
  returns no matches after the edit.
- Manual read-through of README.md/AI-AGENT.md to confirm no active-job-search language remains and
  tone matches the Hero banner / resume framing already shipped this session.
- No source code touched — `tsc`/`eslint`/test suite not applicable.
