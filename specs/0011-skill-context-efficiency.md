# SPEC-0011: Context-efficiency pass on skills, CLAUDE.md, DESIGN.md

**Status**: Implemented
**Date**: 2026-09-14

## What

Apply OpenAI's Sep 2026 "Rethinking skills and prompts for GPT-6 Astra" guidance to this repo's own
agent-facing instruction files: convert blanket "read this whole doc before starting" instructions into
contextual ones (read X for Y, not X unconditionally), and narrow an overly broad skill trigger
description. Specifically:

- 8 `skills/*/SKILL.md` files (`add-demo`, `agentic-seo`, `executive-review`, `recruiter-review`,
  `redesign-portfolio`, `security-review`, `self-heal`, `testing`) each opened with "Read `CONTEXT.md`
  before starting" unconditionally, regardless of task size. Reworded to point at the same per-skill
  "Key terms" list but framed as "check CONTEXT.md if unfamiliar" rather than a mandatory upfront read.
- `skills/prasad-portfolio/SKILL.md`'s description ("Activate for any code change, new demo, API route,
  test, or configuration edit") was maximally broad and overlapped with nearly every other skill's own
  trigger, which is the exact failure mode the article describes ("too many skills... shortening
  descriptions to fit... harder to know which skill to pick"). Narrowed to describe what makes this
  skill distinct (baseline invariants layered under task-specific skills) rather than re-listing task
  categories already owned by other skills.
- The same file's and `CLAUDE.md`'s "verify in `node_modules/next/dist/` before writing any code" rule
  was blanket for literally any code change. Scoped to "when touching a Next.js API you're not certain
  still behaves as trained."
- `DESIGN.md` rule 1 ("Before editing any UI copy, read: profile.json, README.md, ai-profile.json,
  llms-full.txt, and homepage copy") — the exact "Bad" pattern from the article's own before/after
  example. Reworded to name `profile.json` as the source of truth and point at the other files only for
  what each is actually useful for, not as an unconditional four-file read.

## Why

User shared OpenAI's article on this exact topic and asked for the findings to be applied. Verified
against actual repo content before editing (not applying the article uncritically): confirmed 8 of 10
skill files use the literal blanket-read pattern the article calls "Bad," confirmed `CONTEXT.md` is 202
lines (a real cost to force-read on every skill invocation), and confirmed `prasad-portfolio/SKILL.md`'s
description repeats trigger conditions ("new demo," "API route," "test," "configuration edit") that
`add-demo`, `testing`, and `security-review` already own individually.

Explicitly did NOT apply the article's "decision boundaries may now be too strict" guidance to this
repo's hard stops (no touching CSP/security headers/executive positioning without explicit request) —
those exist because of documented past incidents in `CLAUDE.md`'s "What Not To Do" section, not generic
caution for a less-capable model, and the cost of getting them wrong is asymmetric regardless of model
capability.

## Scope boundaries

- In scope: the 8 skill files' CONTEXT.md read-instruction, `prasad-portfolio/SKILL.md`'s description
  and node_modules-verification line, `CLAUDE.md`'s matching node_modules line, `DESIGN.md` rule 1.
- Out of scope (this pass): rewriting the "Step 0 — Clarify" recipes inside each skill (the article's
  point 3 about overly-prescriptive itineraries) — not requested, and would need a closer read of each
  skill's actual workflow to avoid removing guidance that's load-bearing rather than just verbose. Also
  out of scope: `CONTEXT.md`'s own stale content discovered incidentally while reading it (still says
  "14 stages" for layers, lists only 4 featured roles missing "zip," and `here-head`'s glossary
  description doesn't match its current `profile.json` title) — flagged to the user separately, not
  fixed here since it wasn't part of what was asked.

## Evidence to reuse

- OpenAI, "Rethinking skills and prompts for GPT-6 Astra" (developers.openai.com/blog, Sep 11, 2026) —
  specifically its before/after examples for skill descriptions and `AGENTS.md`/doc-reading instructions.
- Each skill file's existing "Key terms" list was reused verbatim as the scope of what to point at in
  `CONTEXT.md`, rather than inventing new groupings.

## Verification

- Frontmatter YAML in all touched SKILL.md files still parses (no structural changes to frontmatter
  besides the `prasad-portfolio` description).
- Manual read-through confirming no removed content, only reworded framing (all "Key terms" lists,
  file cross-references, and rule content preserved).
- No source code (`.ts`/`.tsx`) touched — `tsc`/`eslint`/test suite not applicable to this pass.
