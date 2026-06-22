---
name: self-heal
description: Autonomous test-fail → diagnose → patch → retest → document loop. Use when the CI build is broken, tests are failing, TypeScript errors appeared after a change, or the build is red. Determines cause, applies the minimal fix, retests, updates docs, and generates a commit summary. Never makes speculative changes — only fixes the identified failure.
---

# Self-Heal — Autonomous Repair Loop

Read `CONTEXT.md` before starting. Key terms: **vitest**, **playwright**, **guardrail check**, **observability event**.
Also load profile: `profiles/testing.yaml`.

## When to invoke this skill

- `npm run test` has failures after a code change
- `npx tsc --noEmit` returns errors
- `npm run build` fails
- `npm audit --audit-level=high` returns new high/critical findings
- A Playwright E2E test regressed
- Coverage dropped below a gate threshold

Do NOT invoke for: new feature development, redesigns, or speculative refactors.
This skill fixes exactly what is broken — nothing more.

## Phase 1 — Identify the failure

Run the full check sequence and capture every failure:

```bash
npx tsc --noEmit 2>&1 | head -50          # TypeScript errors first
npm run lint 2>&1 | head -50              # Lint errors
npm run test 2>&1 | tail -80              # Test failures
npm audit --audit-level=high 2>&1         # New vulnerabilities
```

From the output, extract:
- **Failure type**: TypeScript error / lint error / test failure / audit finding / build error
- **File(s) affected**: exact paths
- **Error message(s)**: verbatim
- **Likely cause**: what change triggered this?

State the diagnosis explicitly before writing any code.

## Phase 2 — Scope the fix

Write the agent operating contract before touching any file:
- **Root cause**: one sentence
- **Files to change**: minimum set (usually 1-2 files)
- **What NOT to touch**: list of files that must stay unchanged
- **Verification**: exact commands that will prove the fix

Hard constraints:
- Fix only the identified failure — no drive-by refactors
- Do not change CSP, security headers, rate limits, or guardrails (these require human approval — see AGENTS.md Security Scope)
- Do not add `any` or `ts-ignore` without a comment explaining why
- Do not disable a test — fix the code or the test

## Phase 3 — Apply the fix

Common failure patterns and standard fixes:

### TypeScript TS2345 — readonly array type mismatch
```typescript
// Pattern: group.ids.includes(d.id) fails because as const makes ids readonly
// Fix: cast to readonly string[]
(group.ids as readonly string[]).includes(d.id)
```

### TypeScript — missing type on component prop
```typescript
// Add the type annotation; never use `any`
interface Props { children: React.ReactNode }
```

### Test failure — wrong href assertion after link change
```typescript
// Update the test assertion to match the new href
expect(link.getAttribute('href')).toBe('/demos')  // was '/agent-marketplace'
```

### Lint — react-hooks/exhaustive-deps
```typescript
// Option 1: add the dependency (correct if it should re-run)
// Option 2: disable with comment if intentional init-only effect
// eslint-disable-next-line react-hooks/exhaustive-deps
```

### Build failure — missing export
```typescript
// Ensure named export exists; check ADR-0002 (named exports only)
export function MyComponent() { ... }
```

### npm audit finding
```bash
npm audit fix                    # for non-breaking patches
# For breaking changes: pin to last safe version in package.json
```

## Phase 4 — Retest

Run the full check sequence again:

```bash
npx tsc --noEmit                 # must be clean
npm run lint                     # must be clean
npm run test                     # must pass
npm run build                    # must pass
npm audit --audit-level=high     # 0 high/critical
```

If any check still fails: return to Phase 2. Do not commit a partial fix.

## Phase 5 — Update docs

If the fix reveals a gap in documentation:
- If it is a pattern worth remembering → add to `CLAUDE.md` "What Not To Do" section
- If it is a recurring pattern → consider a new ADR in `docs/adr/`
- If it is a test gap → note in `evaluations/testing.yaml` under `open_gaps`

## Phase 6 — Generate commit summary and run record

Commit message format:
```
fix(<scope>): <one-line description>

Root cause: <one sentence>
Files changed: <list>
Verified: tsc clean, lint clean, tests pass, build passes
```

Create a run record in `runs/<date>-self-heal-<scope>/summary.yaml`:
```yaml
run_id: <date>-self-heal-<scope>
date: <date>
skill: self-heal
profile: testing
failure_type: <typescript|lint|test|build|audit>
root_cause: <one sentence>
files_changed: [<list>]
duration_seconds: <N>
gates_passed: <N>
gates_failed: 0
hallucinations_detected: 0
steps_missed: 0
```

## Anti-patterns (never do these)

- Do NOT add `@ts-ignore` without a comment — it hides the real problem
- Do NOT skip the retest phase — a fix that passes locally may break another test
- Do NOT change working code adjacent to the failure
- Do NOT add a try/catch to silence a runtime error — fix the error
- Do NOT modify CSP, security headers, or rate limits without human approval
- Do NOT delete a failing test — tests are the contract, not the obstacle
