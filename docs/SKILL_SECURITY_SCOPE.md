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

## All nine skills are scanned (SPEC-0044, 2026-10-20)

Until SPEC-0044 only `skills/prasad-portfolio` was scanned. Now every folder under `skills/` is, one job per skill
(`SkillSpector (<skill>)`; a manual run scans all nine), and a final job named `SkillSpector Scan` requires all of them to pass, so the status
name used for merge checks did not change.

- Each skill has its own entry in `.github/skill-security-scope.json` (`skills` list): exact SHA-256 of its SKILL.md,
  the exact lines where the scanner reports a missing reference, and the tracked application files those lines name.
  The rules above apply to every entry unchanged. A skill with no entry gets the strict default and fails on any
  incomplete report.
- All nine skills have a single SKILL.md and no other files, and the first scan found no HIGH or CRITICAL findings and
  only `reference_missing` notices (paths into the application, or files a skill writes when it runs, such as
  `docs/testing.md`).
- Four of the other eight skills (add-demo, redesign-portfolio, self-heal, testing) have MEDIUM findings, all rule RP1
  ("MCP server referenced without pinned version") on `npx tsc --noEmit`. That is the project's own TypeScript compiler
  run through `npx`, not a downloaded MCP server, so the finding is a false positive of the rule. The project skill's
  two documented MEDIUM findings (the same RP1 and RA2 "Session Persistence") are unchanged. All stay visible as
  warnings and none is dismissed or hidden.
- A unit test fails if a skill folder, the scope file and the workflow matrix stop agreeing, or if a SKILL.md changes
  without its entry being refreshed.

To change a skill: edit it, run `skillspector scan skills/<name> --format sarif --output skillspector-report.sarif
--no-llm`, then `python3 .github/scripts/skill_security_propose.py skills/<name> skillspector-report.sarif` to print a
proposed entry. Read each reference line and file by hand, then paste the entry into the scope file. The helper never
writes the file. To add a skill, add its folder, a scope entry and its name in the workflow matrix in one pull request.

## Plugin skills (SPEC-0045, 2026-10-21)

The scan also covers skills inside plugins (`plugins/<plugin>/skills/<name>`, currently `evaluate-fit`), so ten skills
in all. The gate accepts only `skills/<name>` or `plugins/<plugin>/skills/<name>` as a target. `evaluate-fit` references
no repository files, so its first scan was complete with no notices; its scope entry has empty reference lines and exists
to pin the skill text by hash. The unit tests also check the marketplace and plugin manifests.
