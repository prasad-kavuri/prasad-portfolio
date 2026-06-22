# AI Agent Context — prasad-portfolio

## Document Hierarchy

When instructions conflict, apply this priority order:

`AGENTS.md` → `CLAUDE.md` → `docs/ARCHITECTURE.md` → `docs/SECURITY_THREAT_MODEL.md` → source code comments

`AGENTS.md` is the universal agent contract (all tools). `CLAUDE.md` adds Claude Code-specific and portfolio-specific rules on top of this file. If you are not Claude Code, `CLAUDE.md` still applies — it contains the demo execution modes table, WASM/CSP critical rules, and learned "What Not To Do" lessons that are not duplicated here.

---

## Domain Language

Read `CONTEXT.md` at the repo root before any coding session. It defines the canonical vocabulary for this codebase — **browser demo**, **server demo**, **layer**, **signature demo**, **module card**, **exec model**, **featured role**, **HITL gate**, **accent brand**, **llms-txt**, **agentic-seo**, **krutrim**, **ola**, **here**, **playwright**, **vitest**, and more (45+ terms). Using these terms precisely reduces ambiguity and token usage.

Key ADRs in `docs/adr/` explain the most surprising architectural decisions:
- `0001` — LLM calls are server-only (never from the browser)
- `0002` — Named exports only (no `export default` except page files)
- `0003` — CSP/WASM headers live in both `next.config.ts` AND `src/proxy.ts`
- `0004` — `useBrowserAI` hook is mandatory for all browser demos
- `0005` — LLM Router dispatches to Groq only (no multi-provider fan-out)
- `0006` — `llms.txt` is the canonical plain-text portfolio for LLM crawlers
- `0007` — JSON-LD uses a single `@graph` with all entity types
- `0008` — Playwright is E2E; Vitest is unit — no overlap
- `0009` — CSP uses hash/mime-type allowlisting, not nonces (Vercel constraint)
- `0010` — No shadcn/ui — Tailwind utilities only, ARIA manually implemented

## Portfolio Skills

`skills/add-demo/SKILL.md` — step-by-step checklist for adding a new demo. Run it when the user asks to add a demo.

`skills/redesign-portfolio/SKILL.md` — full workflow for redesigning or adding a UI section: component → a11y → tests → SEO → llms.txt → PR summary.

`skills/testing/SKILL.md` — run the full test suite (lint, typecheck, unit, E2E, coverage, Lighthouse) and generate `docs/testing.md`.

`skills/security-review/SKILL.md` — security audit: npm audit, semgrep, gitleaks, CSP headers, rate limiting, guardrails, SSRF. Generates `docs/security.md`.

`skills/agentic-seo/SKILL.md` — AI crawler discoverability audit: llms.txt, ai-agent-manifest.json, JSON-LD, sitemap, LLM compatibility test. Generates `docs/discoverability.md`.

`skills/recruiter-review/SKILL.md` — persona simulation for a target company (CTO, VP Eng, Executive Recruiter). Outputs strengths, concerns, missing keywords, interview readiness score.

`skills/executive-review/SKILL.md` — named executive persona simulation (Dario Amodei, Sam Altman, Patrick Collison, Thomas Dohmke, Satya Nadella, Joe Heck, Jensen Huang). Outputs first impression, confidence, concerns, board readiness, and "schedule a call" probability.

See `EVALUATIONS.md` at the repo root for the current quality gate scorecard (8.8/10 → target 9.8/10).

---

## What This Project Is
Production-grade AI engineering portfolio. Next.js 16.2.6 App Router + Turbopack.
**Do NOT assume standard Next.js patterns** — verify in `node_modules/next/dist/docs/`
before writing any code. APIs, middleware, and config differ from training data.

## Coding Behavior (Karpathy-Inspired)

Four rules that apply to every change. They exist to prevent unfounded assumptions,
overengineering, and unwanted scope creep — the three most common LLM coding mistakes.

**1. Think Before Coding**
State assumptions explicitly. If multiple interpretations are valid, surface them rather
than picking silently. If something is unclear, stop and ask before implementing.

**2. Simplicity First**
Write the minimum code that solves the stated problem. No speculative abstractions.
No flexibility that wasn't requested. No error handling for impossible scenarios.
If it can be 50 lines instead of 200, it should be.

**3. Surgical Changes**
Touch only what the task requires. Do not improve, reformat, or rename adjacent code.
Match the existing style. Mention unrelated dead code — don't delete it.
Every changed line must trace directly to the user's request.

**4. Goal-Driven Execution**
For multi-step tasks, state a brief plan with verifiable checks before starting.
Transform vague goals into testable outcomes: build passes, tests pass, coverage gates pass.
Verify success explicitly — don't assume "it works" without running the checks.

## Agent Operating Contract

For every non-trivial coding task, state this before editing:
- Assumptions: what you believe is true, and what remains unknown.
- Scope boundaries: what is intentionally in and out of scope.
- Files expected to change: the smallest expected file set.
- Verification commands: exact commands that will prove the change.
- Rollback notes: only for risky changes, describe the simplest way back.

Anti-patterns:
- No drive-by refactors.
- No broad rewrites.
- No speculative abstractions.
- No touching CSP, security headers, auth, env handling, SSRF, rate limits,
  logging, or deployment config unless explicitly requested.
- No changing executive positioning, profile title, signature system, metadata,
  JSON-LD, llms files, entity files, or demo registry entries unless requested.

Definition of Done:
- `npm run lint` passes.
- `npm run test` or the task-specific test command passes.
- `npm run build` passes.
- `npm audit --audit-level=high` passes with 0 high/critical vulnerabilities.
- Every changed line directly maps to the user's request.

## Architecture Rules
1. Rate limit ALL new API routes using `enforceRateLimit` from `src/lib/api.ts`
2. Log ALL API requests using `startTimer` + `logAPIEvent` from `src/lib/observability.ts`
3. Validate ALL inputs at route entry (length, type, schema) — reject before LLM call
4. Run user input through `enforceGuardrails` (or `checkInput`) from `src/lib/guardrails.ts`
5. Never add `output: 'export'` to next.config.ts (breaks API routes)
6. Security headers live in BOTH `next.config.ts` AND `src/proxy.ts` — update both if needed
7. Middleware export is named `proxy` in `src/proxy.ts` (non-standard — check before editing)

## Security Scope
This Agent Sandbox Contract applies to Codex, Claude Code, Cursor, Copilot,
skills.sh, and any coding-agent workflow used with this repository.

- Agents must not read, print, copy, summarize, commit, or expose `.env*`,
  Vercel secrets, API keys, tokens, private logs, or local machine files.
- Agents are limited to repo-scoped source files only.
- Default to read-only mode unless the user explicitly requests a code change.
- Do not write outside this repository.
- Do not run shell commands that exfiltrate secrets or copy sensitive files.
- Do not make network calls except approved package installs, GitHub, npm
  registry access, and documented public model/source URLs.
- Do not run destructive commands such as `rm -rf`, force pushes, credential
  changes, chmod/chown outside the repo, or global config mutations.
- Any file-system touching workflow must preserve `.gitignore` secret
  exclusions.
- Human approval is required before changes touching security headers, auth,
  env handling, rate limits, SSRF, logging, or deployment config.
- Skill execution is scoped to documentation and source code understanding only.
- All skill and API route execution runs inside Vercel's serverless sandbox — non-root, network-isolated, ephemeral. No persistent shell access, no host filesystem access outside the repo.

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
| `guardrails.ts` | Canonical guardrails: `enforceGuardrails`, `checkInput`, `checkOutput`, `validateAgentHandoff`, `detectPromptInjection`, `isPromptInjection`, `sanitizeLLMOutput` |
| `eval-engine.ts` | `scoreResponse`, `runEvals` — LLM-as-Judge scoring |
| `drift-monitor.ts` | `trackModelOutput`, `getDriftSnapshot` — output drift detection |
| `cost-control.ts` | Per-route token cost tracking |
| `hitl.ts` | Human-in-the-loop checkpoint utilities |
| `rate-limit.ts` | Upstash-backed rate limiting + SHA-256 IP hashing |
| `analytics.ts` | Usage event tracking |
| `query-log.ts` | Runtime query capture for live eval snapshots |

## Before Committing
- `npm run build` — must succeed, zero errors
- `npm run test` — all tests must pass (comprehensive suite: unit, integration, fuzz, evals, and accessibility)
- `npm audit --audit-level=high` — 0 high/critical vulnerabilities

## CI/CD
GitHub Actions: `.github/workflows/ci.yml`
Jobs: `lint-and-unit` (security audit → lint → vitest coverage) → `e2e` matrix (chromium/firefox/webkit)
Coverage gates: API routes ≥90% statements / ≥85% branches; lib ≥95% functions (currently 100%)
Dependabot: `.github/dependabot.yml` — major versions blocked, weekly minor/patch updates

## Key Invariants
- `next` is pinned to exact `16.2.6` (no caret) — do not add `^`
- `profile.personal.title` = "VP / Head of AI Engineering" — do not change without updating layout.tsx
- All URLs use `https://www.prasadkavuri.com` (with www) — be consistent
- New demos need entries in BOTH `src/data/demos.ts` AND `src/components/sections/AITools.tsx` (DEMO_GROUPS ids array)
- `react-hooks/set-state-in-effect` ESLint rule fires on `setState()` inside `useEffect` — use `// eslint-disable-next-line` when the pattern is intentional (e.g., client-only hydration-safe init with `useState(null)`)
- Signature system is `evaluation-showcase` (AI Evaluation Showcase) — referenced in Hero, AITools featured card, and README

## Enterprise Simulation Agent

**File**: `src/app/api/enterprise-sim/route.ts`
**Role**: Simulates the Anthropic Analytics API + OTEL event stream for demo purposes

### Behavior contract
- Always returns deterministic data (seeded, not random) for the same query params
- Adds artificial latency (80-200ms) to simulate real API round-trips
- Never returns real user data, credentials, or external API calls
- Validates all inputs — returns 400 for invalid params, 500 for unexpected errors with safe messages
- Token usage data follows Anthropic's actual usage_metadata response shape:
  `{ input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens }`

### OTEL event schema
Events use structured observability fields for LLM spans. The `tokenCost` field mirrors the `anthropic-beta: usage-metadata-2024` response shape.

### Security constraints
- No write operations (read-only simulation)
- No external network calls from within this route
- Input length cap: all string params max 100 chars
- Rate limiting: inherits existing middleware rate limiting

## JSON-LD Resume Agent

**File**: `src/lib/resumeJsonLd.ts`
**Role**: Post-processing utility that converts structured resume fields into schema.org/Person JSON-LD

### Behavior contract
- Input: `ResumeData` fields mapped from LLM response + profile.json static data
- Output: valid JSON-LD conforming to `schema.org/Person` vocabulary
- Never invents data — only maps fields present in input; omits keys for missing fields
- Deterministic: same input always produces same output
- Safe: output is JSON only, never contains script content or HTML
- `worksFor` is ONLY set for experience entries where `endDate === 'Present'` or `endDate` is undefined
- Response fields added: `jsonLd` (object) and `jsonLdScript` (ready-to-embed `<script>` string)

## Observability Chart

**File**: `src/components/observability/LatencyCostChart.tsx`
**Role**: Dual-axis SVG chart showing inference latency vs. cost-per-request over 24 hours

### Behavior contract
- Data is seeded/deterministic (`seededRand(0xdeadbeef)`) — same chart every load
- `generateData()` and `seededRand()` are exported for unit testing
- No external dependencies — plain SVG only
- Used on `/governance` page; in production would connect to `/api/enterprise-sim` or OTEL collector
