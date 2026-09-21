# SPEC-0017: Agent-readiness quick-start + showcase page

**Status**: In Progress
**Date**: 2026-09-21

## What

Two additive pieces, both about making the repo's existing AI-agent-operability surface (AGENTS.md,
CLAUDE.md, skills/, profiles/, evaluations/, runs/, docs/adr/, specs/) legible to two audiences that
don't currently see it:

1. A short, tool-agnostic "Quick Start" section near the top of `AGENTS.md` so a coding agent that has
   never seen this repo (Codex, Cursor, Copilot, etc. — not just Claude Code) gets setup/test/build
   commands and a pointer to the rest of the contract, without needing to read `CLAUDE.md` first.
2. A new page, `/agent-readiness`, that presents this same operability surface to a human or AI-recruiter
   audience as evidence of engineering discipline — most visitors will never open `AGENTS.md` on GitHub,
   but the fact that it (and the skills/profiles/evaluations/runs system behind it) exists is a genuine
   differentiator worth surfacing on the site itself.

## Why

Prompted by a discussion of "the repository is becoming the agent spec" (AGENTS.md becoming a
cross-tool standard). This repo already implements that pattern more thoroughly than the trend piece
describes — the gap isn't adoption, it's that (a) the AGENTS.md quick-start assumes a reader who already
has CLAUDE.md context, and (b) none of this shows up anywhere a recruiter or hiring-manager-run AI agent
would see it while browsing the live site.

## Scope boundaries

- In scope: `AGENTS.md` quick-start section; new static `/agent-readiness` page; one nav entry under the
  "Platform" menu in `Navbar.tsx`.
- Out of scope (this pass): restructuring `AGENTS.md`'s existing content, changing `CLAUDE.md`, adding new
  skills/profiles/evaluations, JSON-LD/llms.txt changes, editing the demo registry.

## Evidence to reuse

- Page structure/visual language: `src/app/governance/page.tsx` (back link, `ThemeToggle`, `Card`, section
  bands).
- Existing content to surface, not duplicate: `AGENTS.md`, `skills/*/SKILL.md`, `profiles/*.yaml`,
  `evaluations/*.yaml`, `runs/README.md`, `docs/adr/`, `specs/README.md`. The page links to these (GitHub
  blob links, since Next does not route markdown/YAML files) rather than re-authoring their content.
- Nav pattern: `platformLinks` array in `src/components/layout/Navbar.tsx`.

## Open questions / [NEEDS CLARIFICATION]

None — page is presentational only, no new data source needed.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/app/agent-readiness/page.tsx src/components/layout/Navbar.tsx`
- `npm run build`
