# Skill and application security: separate scopes

## Decision (PR #140)

SkillSpector scans the unchanged `skills/prasad-portfolio` bundle, currently one
SKILL.md. It is not a TypeScript application scanner. The repository's separate
`CI / Lint & Unit Tests` job runs Semgrep (OWASP, JavaScript, Next.js rules),
gitleaks, the dependency-audit policy, and Vitest coverage including the red-team
corpus. Playwright runs separately. These checks must also pass before merging;
a successful SkillSpector check alone is not sufficient. No branch protection
settings or application scanner rules are changed by this PR.

## Why a scoped exception exists

Pinned SkillSpector 2.12.0 fully inspects the skill text but reports 32 missing
reference notifications because it cannot find application files inside the
skill folder. Copying those files into its bundle exposes unsupported TypeScript
parsing and pattern matches against the guardrail detector's own attack strings.
That experiment is not a substitute for application security analysis.

The reviewed boundary is recorded in `.github/skill-security-scope.json`:

- An exact SHA-256 of the unmodified skill text and the exact notification lines.
- The 18 referenced application files, which must exist, remain tracked, and
  resolve inside the checkout. `layout.tsx` refers to `src/app/layout.tsx`.
- Line 164 contains a version literal, `16.2.6`, not a file. Line 165 also contains
  a property name, `profile.personal.title`, not a file. Both are scanner
  reference-detection limitations, not bundled dependencies.

Only nonfatal `reference_missing` notifications at those reviewed lines qualify.
The exception requires one fully inspected component, no partially inspected or
uninspected files, no analyzer limitations, no truncation, and an exact match to
all 32 notifications. Adding a bundled file or changing even one byte of SKILL.md
invalidates the exception and requires a fresh review. Other/manual skills get
the strict default policy. Do not automatically refresh the hash or line list.

## What still blocks

Missing/malformed reports, scanner crashes, failed execution, error notifications,
new or changed references, parser limitations, skipped files, and HIGH/CRITICAL
findings block. MEDIUM findings still require triage but do not block, matching
the existing risk threshold. No findings are dismissed or removed from SARIF.

The original SARIF completeness remains **partial** in both stored and uploaded
reports. A warning and job summary explicitly state that a scoped skill check
passed, not that the entire dependency chain was inspected. Repository-relative
location normalization is the only SARIF transformation.

## Limits and maintenance

Application scanning and regression tests do not prove that the skill's full
behavior is safe. Static-only SkillSpector does not replace semantic review or
an authorized penetration test. Semgrep rule coverage and the red-team corpus
are bounded; JSON/configuration files also need human review. The two existing
MEDIUM skill findings are not resolved by this scope decision.

When skill text, scanner version, or the scope policy changes, inspect raw
notifications and affected references; rerun gate tests, SkillSpector, and CI.
Review scope-policy changes as security-sensitive changes. Remove this exception
if the scanner gains suitable repository-context support. Main-branch pushes,
PRs, scheduled and manual scans remain enabled; feature-branch push scans are
removed to avoid duplicate PR runs.

Rollback: revert this scope-policy follow-up to restore strict blocking on every
incomplete report. Application controls and production behavior are unchanged.
