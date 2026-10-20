# SPEC-0044: Scan all nine skills, not only the project skill

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-20

## What

The SkillSpector workflow now scans every skill under `skills/` (nine), one job each, plus a final job named
`SkillSpector Scan` that passes only if all nine pass. `.github/skill-security-scope.json` now holds one reviewed entry
per skill. The gate script picks the entry for the skill being scanned. A helper prints a proposed entry for human
review. Unit tests keep the skills folder, the scope file and the workflow list in agreement.

## Why

SPEC-0043's OWASP mapping (AST01, AST07) showed the other eight skills could change with no scan or hash gate. They
are instructions that agents read and follow, so they are the same kind of risk as the project skill.

## Findings from the first scan (SkillSpector 2.12.0 pinned, static only)

- All nine: analysis "partial" because of `reference_missing` notices only (paths into the application or files the
  skill writes when it runs). No HIGH or CRITICAL findings; no execution errors.
- Four of the other eight skills (add-demo, redesign-portfolio, self-heal, testing) carry MEDIUM RP1 findings, all
  `npx tsc`. False positive: it runs the project's own compiler. The project skill keeps its two documented MEDIUM
  findings (RP1 and RA2). All are left visible as warnings, none suppressed.
- The 32-line exception for `prasad-portfolio` is unchanged.

## Decisions

- Same rules for every skill, no looser exception: exact SHA-256, exact notice lines, tracked application files must
  exist, one component, no limitations. A skill with no entry fails closed.
- Required-check name preserved via an aggregate job so branch protection settings need no change. If branch
  protection lists the per-skill names instead, those are new and must be added by the owner.
- The scope file layout changed from one entry to a `skills` list; the gate still reads the old layout.
- The scope helper never writes the file; refreshing stays a reviewed act.
- Cost: nine short jobs per run instead of one (about a minute each); weekly schedule unchanged.

## Follow-up fix (2026-10-20)

The first version put `if: ... matrix.skill` on the job. GitHub does not allow the `matrix` context there, so the
workflow file was invalid and the run failed with no jobs on the PR branch and on main (SkillSpector did not run at
all). The `if` and the single-skill `skill_path` dispatch input were removed; manual runs now scan all nine skills.
`actionlint` reports the original error and passes on the fixed file (ignoring only its stale `ubuntu-26.04` label
list). Lesson: run `actionlint` on any workflow change before opening the PR.

## Verification

Local: all nine reports pass the gate; editing one byte of a skill makes its gate fail; 22 unit tests pass.
After merge: all nine matrix jobs and `SkillSpector Scan` green on main.

## Rollback

Revert the pull request; the previous single-skill workflow and scope file return.
