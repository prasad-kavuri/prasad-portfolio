# SPEC-0037: Move all workflows to ubuntu-26.04

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-18

## What

All five GitHub Actions workflows (six jobs) run on `ubuntu-26.04` instead of `ubuntu-24.04`. Only the `runs-on` label
changes.

## Why

SPEC-0034 pinned `ubuntu-24.04` so the `ubuntu-latest` migration (rollout 2026-10-19 to 2026-11-19) could not break CI
unannounced, and said the move to 26.04 would be a deliberate step. The trial on 2026-10-18 ran `ci.yml` (lint and unit
tests, four E2E jobs with Playwright apt dependencies) and `skill-security.yml` (SkillSpector) on `ubuntu-26.04`, and
every job passed. The owner asked to move now, so CI stays on the current OS instead of falling behind.

## Decisions

- Pin the explicit label `ubuntu-26.04`, not `ubuntu-latest`, so the next OS change is also deliberate.
- Move all six jobs together. Three jobs were not part of the trial (`dependency-check.yml`, `model-health.yml`,
  `post-deploy-verify.yml`); they are small Node scripts. After merge, run Model health and post-deploy verification
  once on demand and read the results.
- Rollback is one line per file: change the label back to `ubuntu-24.04`.

## Scope boundaries

- In scope: `runs-on` in `.github/workflows/*.yml`.
- Out of scope: action versions, Node versions, third-party action Node 24 check, anything the workflows check.

## Human approval

Deployment/CI config; approved by the repository owner in chat on 2026-10-18.

## Verification

The PR's own CI, SkillSpector and dependency-check runs on 26.04; after merge, a manual Model health run and the
post-deploy verification run.
