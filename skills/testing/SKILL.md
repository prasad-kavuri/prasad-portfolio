---
name: testing
description: Repository-wide test suite runner and coverage auditor. Use when the user wants to run all tests, check coverage, add missing tests, fix failing tests, audit test health, or generate a testing report. Covers: lint, typecheck, unit, integration, fuzz, evals, E2E, accessibility, and Lighthouse.
---

# Testing — Full Suite

Read `CONTEXT.md` before starting. Key terms: **vitest**, **playwright**, **guardrail check**, **observability event**, **browser demo**, **server demo**.

## Coverage Goals (from CI gates)

| Layer | Statements | Branches | Functions |
|-------|-----------|----------|-----------|
| Global | ≥ 80% | ≥ 80% | ≥ 80% |
| `src/app/api/**` | ≥ 90% | ≥ 85% | ≥ 90% |
| `src/lib/**` | ≥ 95% | ≥ 90% | ≥ 95% |
| `src/components/**` | ≥ 80% | ≥ 75% | ≥ 80% |

## Phase 1 — Fast checks (run first, always)

```bash
npm run lint                      # ESLint — zero errors required
npx tsc --noEmit                  # TypeScript strict — zero errors required
npm audit --audit-level=high      # 0 high/critical vulnerabilities
```

These must pass before running any tests. Fix lint/type errors before continuing.

## Phase 2 — Unit + integration tests

```bash
npm run test                      # Vitest, happy-dom, all src/__tests__/**
npm run test:coverage             # Coverage report (check against goals above)
npm run test:fuzz                 # Adversarial input tests
npm run test:evals                # LLM-as-Judge eval suite (requires GROQ_API_KEY)
```

Review coverage output. For any file below its threshold:
1. Identify uncovered branches using the HTML coverage report in `coverage/`
2. Add targeted test cases — prefer branch coverage over statement coverage
3. Re-run `npm run test:coverage` to confirm gates pass

## Phase 3 — E2E (requires built server)

```bash
npm run build                     # Must pass before E2E
npm run test:e2e                  # Playwright: chromium, firefox, webkit, mobile
```

E2E tests live in `e2e/*.spec.ts`. They cover:
- Homepage renders (Hero, AIArchitecture, DemosGallery)
- `/demos` page loads with all filter tabs
- `/governance` page loads with observability chart
- Accessibility: axe-core assertions on each critical page
- Mobile viewport: `iPhone 12` preset

Playwright strict mode is enabled — use `.first()` on any `getByText()` call that
matches nav + body text (known footgun — see ADR-0008, CLAUDE.md).

## Phase 4 — Accessibility audit

```bash
# Automated axe checks run inside Playwright E2E above
# For manual audit, install and run:
npx axe-core-cli https://localhost:3000
npx axe-core-cli https://localhost:3000/demos
npx axe-core-cli https://localhost:3000/governance
```

Manual checklist:
- [ ] All images have `alt` text
- [ ] All interactive elements have `aria-label` or visible label
- [ ] Focus order is logical (Tab through the page)
- [ ] Color contrast ≥ 4.5:1 for normal text
- [ ] No keyboard traps
- [ ] Skip-link exists on `/demos` page (`<a href="#main-content">`)

## Phase 5 — Performance (optional, Lighthouse)

```bash
# Requires built server running on localhost:3000
npx lighthouse http://localhost:3000 --output json --quiet | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log('Performance:', d.categories.performance.score * 100);
  console.log('Accessibility:', d.categories.accessibility.score * 100);
  console.log('SEO:', d.categories.seo.score * 100);"
```

Targets: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.

## Phase 6 — Generate docs/testing.md report

After all phases pass, write `docs/testing.md` with:

```markdown
# Testing Report — <date>

## Summary
- Lint: PASS
- TypeScript: PASS  
- Unit tests: <N> passed, <N> total
- Coverage: statements <X>%, branches <X>%, functions <X>%
- E2E: <N> passed across chromium/firefox/webkit/mobile
- Accessibility: PASS / <N> violations found
- Lighthouse: Performance <X>, Accessibility <X>, SEO <X>

## Coverage by layer
<table from coverage output>

## Open gaps
<list any files below threshold>

## Recommended next tests
<list 3-5 highest-value missing tests>
```

## Adding missing tests

For API routes (`src/app/api/<name>/route.ts`):
- Happy path: valid input → 200 with expected shape
- Rate limit: mock `enforceRateLimit` to return `{ success: false }` → expect 429
- Guardrail: mock `enforceGuardrails` to return `{ safe: false }` → expect 400
- Invalid input: missing field, field too long → expect 400

For components (`src/components/**/*.tsx`):
- Renders without throwing
- ARIA attributes present in initial state
- Key interactive behavior (click, expand, filter)
- `trackEvent` called on user interaction

Mock template:
```typescript
vi.mock('@/components/ui/motion', () => ({
  FadeUp: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));
```
