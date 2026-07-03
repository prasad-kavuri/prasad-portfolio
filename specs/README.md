# Specs

Lightweight spec-driven development for this repo, inspired by [GitHub's Spec Kit](https://github.com/github/spec-kit)
and its Spec-Driven Development (SDD) methodology — adopted in spirit, not as the literal tool.

## Why

`docs/adr/` records *why* a decision was made, after the fact. `specs/` records *what* is about to be
built and *why*, before any code is written. Together they close the loop: spec before implementation,
ADR after a consequential decision.

## When to write one

Before implementing a non-trivial feature — a new page, a new architecture layer, a new piece of real
logic (not a copy edit, not a small bugfix). Skip it for small, obviously-scoped changes.

## What goes in a spec

Copy `TEMPLATE.md` to `NNNN-short-slug.md` (four-digit sequence, matching the `docs/adr/` numbering style)
and fill in:

- **What / Why**: the feature in plain language, and the reason it's needed. No implementation details.
- **Scope boundaries**: what's explicitly in and out of scope for this pass.
- **Evidence to reuse**: existing code/demos this should link to or build on, rather than duplicate.
- **Verification**: exact commands that will prove it works (tsc, lint, tests, build).

This deliberately does not include the full Spec Kit workflow (`constitution.md` articles, mandatory
CLI-first/library-first rules, enforced red-phase TDD) — those are built for library/service codebases,
not a Next.js content site, and this repo's `CLAUDE.md` Agent Operating Contract already covers the same
ground more simply.

## Process

1. Write the spec.
2. Implement against it.
3. Verify (`tsc --noEmit`, `eslint`, targeted tests, isolated build — per this repo's Definition of Done).
4. If a spec surfaces a durable architectural decision worth recording, add a matching entry to `docs/adr/`.
