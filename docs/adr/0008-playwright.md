# ADR-0008: Playwright is the E2E framework; Vitest is the unit framework — no overlap

**Status**: Accepted  
**Date**: 2026-06

## Context

The portfolio has two test layers: fast unit tests for components/lib and slower
browser-based E2E tests for critical user paths. The team needed to decide which tools
cover which layer, and whether there is any overlap.

## Decision

- **Vitest** (`npm run test`) — all unit and integration tests in `src/__tests__/`.
  Uses happy-dom for React component tests. Covers: all API routes, all lib utilities,
  all components, fuzz tests, eval tests. Must run in <30 seconds.
- **Playwright** (`npm run test:e2e`) — E2E smoke tests in `e2e/*.spec.ts`. Runs
  against a built server (`next build` + `next start`). Covers: critical user paths
  (homepage loads, demos page, governance page, accessibility checks). Three browsers
  (chromium, firefox, webkit) + mobile viewport.

The two layers do not duplicate assertions. Vitest tests the behavior of isolated
modules; Playwright tests that the full deployed page renders correctly for users.

## Alternatives considered

- **Cypress instead of Playwright**: Cypress has better React Testing Library integration.
  Rejected because Playwright has native multi-browser support (WebKit via Apple's
  engine) critical for mobile Safari coverage, and runs headlessly in GitHub Actions
  without Xvfb configuration.
- **Playwright for all tests (no Vitest)**: Single tool. Rejected because Playwright
  tests are 10-50x slower than Vitest unit tests — running all tests through Playwright
  would break the <30s fast-feedback loop for CI.
- **Jest instead of Vitest**: Similar API. Rejected because Vitest integrates with
  Turbopack's module graph for test transforms, producing faster transforms on the
  existing Next.js 16 + TypeScript 6 stack.

## Consequences

- `npm run test` runs Vitest only — fast, no server needed.
- `npm run test:e2e` requires `npm run build` first — slow, run in CI only.
- Playwright strict mode is enabled — `getByText()` must use `.first()` when nav/footer
  links duplicate body text (known footgun — documented in CLAUDE.md What Not To Do).
- Mobile viewport E2E uses Playwright's `iPhone 12` device preset.
- Any new E2E test must be in `e2e/` with `.spec.ts` extension and follow the existing
  `test.describe` → `test.beforeEach` → `test` pattern.
