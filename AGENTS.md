# AI Agent Context — prasad-portfolio

## What This Project Is
Production-grade AI engineering portfolio. Next.js 16.2.3 App Router + Turbopack.
**Do NOT assume standard Next.js patterns** — verify in `node_modules/next/dist/docs/`
before writing any code. APIs, middleware, and config differ from training data.

## Architecture Rules
1. Rate limit ALL new API routes using `enforceRateLimit` from `src/lib/api.ts`
2. Log ALL API requests using `startTimer` + `logAPIEvent` from `src/lib/observability.ts`
3. Validate ALL inputs at route entry (length, type, schema) — reject before LLM call
4. Run user input through `enforceGuardrails` (or `checkInput`) from `src/lib/guardrails.ts`
5. Never add `output: 'export'` to next.config.ts (breaks API routes)
6. Security headers live in BOTH `next.config.ts` AND `src/proxy.ts` — update both if needed
7. Middleware export is named `proxy` in `src/proxy.ts` (non-standard — check before editing)

## File Structure
- API routes: `src/app/api/[name]/route.ts`
- Demo pages: `src/app/demos/[name]/page.tsx`
- Special pages: `src/app/status/page.tsx`, `src/app/governance/page.tsx`
- Shared data: `src/data/profile.json` (do not duplicate data elsewhere)
- Demo registry: `src/data/demos.ts` + `src/components/sections/AITools.tsx` (DEMO_GROUPS ids array — update both)
- Tests: `src/__tests__/[api|components|evals|fuzz|integration|lib|resilience|stateful]/`
- E2E: `e2e/*.spec.ts`

## Key Library Files (`src/lib/`)
| File | Purpose |
|---|---|
| `api.ts` | `enforceRateLimit`, `jsonError`, `createRequestContext`, `finalizeApiResponse` |
| `observability.ts` | `logAPIEvent`, `startTimer`, `detectAnomaly`, `generateClientTraceId`, `createTracedFetch` |
| `guardrails.ts` | `enforceGuardrails`, `checkInput`, `checkOutput`, `validateAgentHandoff`, `detectPromptInjection` |
| `eval-engine.ts` | `scoreResponse`, `runEvals` — LLM-as-Judge scoring |
| `drift-monitor.ts` | `trackModelOutput`, `getDriftSnapshot` — output drift detection |
| `cost-control.ts` | Per-route token cost tracking |
| `hitl.ts` | Human-in-the-loop checkpoint utilities |
| `rate-limit.ts` | Upstash-backed rate limiting + SHA-256 IP hashing |
| `analytics.ts` | Usage event tracking |

## Before Committing
- `npm run build` — must succeed, zero errors
- `npm run test` — all tests must pass (336 tests, 29 files)
- `npm audit --audit-level=high` — 0 high/critical vulnerabilities

## CI/CD
GitHub Actions: `.github/workflows/ci.yml`
Jobs: `lint-and-unit` (security audit → lint → vitest coverage) → `e2e` matrix (chromium/firefox/webkit)
Coverage gates: API routes ≥90% statements / ≥85% branches; lib ≥95% functions (currently 100%)
Dependabot: `.github/dependabot.yml` — major versions blocked, weekly minor/patch updates

## Key Invariants
- `next` is pinned to exact `16.2.3` (no caret) — do not add `^`
- `profile.personal.title` = "VP / Head of AI Engineering" — do not change without updating layout.tsx
- All URLs use `https://www.prasadkavuri.com` (with www) — be consistent
- New demos need entries in BOTH `src/data/demos.ts` AND `src/components/sections/AITools.tsx` (DEMO_GROUPS ids array)
- `react-hooks/set-state-in-effect` ESLint rule fires on `setState()` inside `useEffect` — use `// eslint-disable-next-line` comment when the pattern is intentional (e.g., client-only hydration-safe init with `useState(null)`)
