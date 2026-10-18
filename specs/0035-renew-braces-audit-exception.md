# SPEC-0035: Renew the braces dependency-audit exception

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-18

## What

The time-boxed exception for GHSA-vfj7-8cjw-p6xm (`braces` <=3.0.3) moves its expiry from after 2026-11-17 UTC to
after 2026-12-17 UTC. Nothing else about the policy changes.

## Why

Renewal check on 2026-10-18: `braces` 3.0.3 is still the latest release (no patch), `npm audit --omit=dev` reports 0
vulnerabilities, and the remaining high findings are reached only through `eslint-config-next` and `shadcn`. npm's
suggested "fixes" are major-version downgrades of those two tools, which the policy forbids. Without a renewal the
audit step would turn CI red on 2026-11-18 for a risk that has not changed.

## Decisions

- Renew for 30 days, not longer, so the question comes back before it is forgotten.
- Keep the exception exact: one advisory, recursive effects only, fail on malformed results.
- Add a test that the exception still applies on the old expiry date, next to the existing expiry test (moved to the
  new date).

## Scope boundaries

- In scope: `scripts/audit-dependencies.mjs`, its test, `docs/DEPENDENCY_AUDIT_EXCEPTION.md`,
  `docs/WELL_ARCHITECTED_SECURITY.md`.
- Out of scope: downgrading or replacing eslint-config-next or shadcn; removing the exception (nothing to patch yet).

## Human approval

Security-policy change; the owner asked for this renewal on 2026-10-18.
