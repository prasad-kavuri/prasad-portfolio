# SPEC-0034: Pin the CI runner and move first-party actions off Node 20

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-18

## What

All five GitHub Actions workflows run on `ubuntu-24.04` instead of `ubuntu-latest`, and the first-party actions move
to versions that run on Node 24: `actions/checkout` v4 to v7, `actions/setup-node` v4 to v6, `actions/setup-python` v5
to v6, `actions/upload-artifact` v4 to v7.

## Why

The Model health run on 2026-10-18 reported two notices:

1. "Node.js 20 is deprecated": `checkout@v4` and `setup-node@v4` target Node 20, which GitHub is forcing onto Node 24.
2. "The ubuntu-latest label will migrate to Ubuntu 26" from 2026-10-19, with the rollout finishing by 2026-11-19
   (actions/runner-images issue 14748). The E2E jobs install Playwright browser dependencies with apt, which is tied to
   the OS release, so an unplanned switch could turn CI red for reasons unrelated to any code change.

## Decisions

- Pin to `ubuntu-24.04` now. Behaviour is unchanged today; the move to 26.04 becomes a deliberate step (below).
- Each new action major was checked by reading its `action.yml`: `runs.using` is `node24` for checkout v7, setup-node
  v6, setup-python v6 and upload-artifact v7.
- setup-node v6's one breaking change limits automatic caching to npm. Every workflow here sets `cache: npm`
  explicitly, so nothing changes.
- Third-party actions are left as they are (`gitleaks/gitleaks-action@v3`, `semgrep/semgrep-action@v1`,
  `github/codeql-action/upload-sarif@v4`); their Node support was not checked.

## Scope boundaries

- In scope: `runs-on` and the four action versions in `.github/workflows/*.yml`.
- Out of scope: the third-party actions above, the Node versions the jobs install (24 in CI, 22 in the two small
  workflows), any change to what the workflows check.

## Evidence to reuse

`.github/workflows/*.yml`; the post-deploy and skill-security workflows already pass on main.

## Open questions / [NEEDS CLARIFICATION]

- Whether the jobs pass on `ubuntu-26.04` is unknown. Before 2026-11-19, open a throwaway PR that sets
  `runs-on: ubuntu-26.04` in `ci.yml` and `skill-security.yml`, read the failures, then move the pin on purpose.

## Verification

- This PR's own CI run: Lint & Unit Tests, all four E2E jobs, SkillSpector Scan and Skill Security Audit must pass.
- After merge: Post-deploy verification (Verify production) and a manual run of Model health pass, and their
  "Node.js 20 is deprecated" annotation is gone.

Rollback: revert the commit; workflows return to `ubuntu-latest` and the old action versions.
