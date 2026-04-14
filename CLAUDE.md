@AGENTS.md

# Claude Code Context — prasad-portfolio

## Project Overview
Production-grade AI engineering portfolio for Prasad Kavuri,
VP / Head of AI Engineering. Live at https://www.prasadkavuri.com

## Tech Stack
- Next.js 16.2.3 (App Router + Turbopack)
- React 19.2.5, TypeScript, Tailwind CSS v4
- Groq SDK for LLM inference (server-side only)
- @huggingface/transformers v4 for browser WASM inference
- Upstash Redis for rate limiting
- Vitest + Playwright for testing

## Key Files
- `src/data/profile.json` — Single source of truth for all profile data
- `src/lib/rate-limit.ts` — Rate limiting (ALWAYS use on new API routes)
- `src/lib/observability.ts` — Structured logging, anomaly detection, trace propagation
- `src/lib/guardrails.ts` — Injection detection, competitor filtering, hallucination heuristics, `enforceGuardrails`
- `src/lib/eval-engine.ts` — LLM-as-Judge scoring (`scoreResponse`, `runEvals`)
- `src/lib/drift-monitor.ts` — Model output drift detection (`trackModelOutput`, `getDriftSnapshot`)
- `src/lib/cost-control.ts` — Per-route token cost tracking
- `src/lib/hitl.ts` — Human-in-the-loop checkpoint utilities
- `src/lib/api.ts` — Shared route utilities (enforceRateLimit, jsonError, etc.)
- `src/app/layout.tsx` — Root layout, metadata, JSON-LD schema
- `src/proxy.ts` — Edge middleware: security headers, .html redirects

## Coding Behavior

These four rules reduce the most common LLM coding mistakes: unfounded assumptions,
overengineering, and unwanted scope creep. They apply to every change in this repo.

### 1. Think Before Coding
- State your assumptions explicitly before implementing. If uncertain, ask.
- If multiple valid interpretations exist, surface them — don't pick silently.
- If a simpler approach exists, say so before building the complex one.
- If something is genuinely unclear, stop, name what's confusing, and ask.
- **This repo non-obvious trap:** Next.js 16.2.3 differs from training data.
  Verify patterns in `node_modules/next/dist/` before assuming standard behavior.

### 2. Simplicity First
- Write the minimum code that solves the problem as stated. Nothing speculative.
- No abstractions for single-use code. No "flexibility" that wasn't requested.
- No error handling for scenarios that cannot occur in this codebase.
- No extra comments, docstrings, or type annotations on code you didn't change.
- If you write 200 lines and it could be 50, rewrite it before submitting.
- Ask: "Would a senior engineer call this overcomplicated?" If yes, simplify.

### 3. Surgical Changes
- Touch only what the task requires. Do not "improve" adjacent code.
- Do not refactor, reformat, rename, or clean up code outside your change.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — do not delete it.
- Remove only imports/variables/functions that YOUR changes made unused.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
- For multi-step tasks, state a brief plan before starting:
  ```
  1. [Step] → verify: [check]
  2. [Step] → verify: [check]
  ```
- Transform vague tasks into verifiable goals:
  - "Add validation" → "Write failing tests for invalid inputs, make them pass"
  - "Fix the bug" → "Write a test that reproduces it, make it pass"
  - "Add a route" → "Build passes, tests pass, coverage gates pass"
- Verify success criteria explicitly — `npm run build` + `npm run test` before done.

## Critical Rules for Claude Code
1. ALWAYS add rate limiting to new API routes via `enforceRateLimit` from `src/lib/api.ts`
2. ALWAYS add observability (`startTimer`, `logAPIEvent`) to API routes
3. ALWAYS add input validation (length + type checks) at route entry
4. ALWAYS run input through `enforceGuardrails` (or at minimum `checkInput`) from `src/lib/guardrails.ts`
5. NEVER expose API keys to the browser
6. ALWAYS sanitize LLM output with DOMPurify before rendering as HTML
7. Run `npm run build` before committing — never commit broken builds
8. Run `npm run test` — all tests must pass before every commit
9. Run `npm audit --audit-level=high` — 0 high/critical vulnerabilities required

## Adding a New Demo
Short version: `src/app/demos/[name]/page.tsx` + `src/app/api/[name]/route.ts` +
rate-limit + observability + guardrails + input validation + unit tests + E2E smoke test.

**IMPORTANT:** Also add the new demo `id` to the `DEMO_GROUPS` array in
`src/components/sections/AITools.tsx` — the homepage grid will silently skip
demos that are in `demos.ts` but not in that array.

## Test Commands
- `npm run test` — unit tests (must pass before every commit)
- `npm run test:coverage` — coverage report (gates: api ≥90% stmts / ≥85% branches, lib ≥95% functions)
- `npm run test:fuzz` — adversarial tests
- `npm run test:evals` — LLM-as-Judge eval suite
- `npm run test:e2e` — Playwright (chromium, firefox, webkit, mobile; requires built server)

## Enterprise Control Plane Demo

**Route**: `/demos/enterprise-control-plane`
**API**: `/api/enterprise-sim`
**Components**: `src/components/enterprise/`

### What it demonstrates
Organisation-wide AI governance: role-based access control (RBAC), group spend limits with token-cost tracking, and OpenTelemetry observability feed. Maps directly to Anthropic's Cowork for Enterprise feature set (April 2026).

### Data model
All data is simulated via `src/lib/enterpriseMockData.ts` using deterministic seeded generation. No external API calls are made — the API route `/api/enterprise-sim` serves mock data with realistic latency simulation.

### Token pricing model
Input: $3/MTok | Output: $15/MTok | Cache read: $0.30/MTok | Cache write: $3.75/MTok (Anthropic API pricing as of April 2026).

### Adding new teams or capabilities
Edit `src/lib/enterpriseMockData.ts`. All types are in `src/components/enterprise/types.ts`. The RBAC panel reads team list dynamically — no hardcoded team names in UI components.

### Running tests
```bash
npm run test -- enterprise
npm run test:e2e -- enterprise-control-plane
```

## Security Posture
CSP (next.config.ts + proxy.ts), rate limiting, prompt injection detection,
competitor mention redaction, hallucination heuristics, XSS sanitization,
input validation, IP SHA-256 hashing, HITL checkpoint (multi-agent), eval
regression gate in CI, `npm audit` in CI.
See README security table and `/governance` page for full inventory.
