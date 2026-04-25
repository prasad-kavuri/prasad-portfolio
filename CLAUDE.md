@AGENTS.md

# Claude Code Context — prasad-portfolio

## Project Overview
Production AI engineering portfolio at prasadkavuri.com. Next.js 16.2.3 / React 19 / TypeScript / Tailwind CSS v4 / Vercel.
Full architecture: see `docs/ARCHITECTURE.md`.

## Tech Stack
- Next.js 16.2.3 (App Router + Turbopack) — pinned exact, no `^`
- React 19.2.5, TypeScript, Tailwind CSS v4
- Groq SDK for LLM inference (server-side only)
- @huggingface/transformers v4 for browser WASM inference
- Upstash Redis for rate limiting
- Vitest + Playwright for testing

---

## Demo Execution Modes — READ THIS BEFORE TOUCHING ANY DEMO

| Demo | Engine | Mode | File |
|------|--------|------|------|
| RAG Pipeline | Transformers.js, all-MiniLM-L6-v2 | **Browser WASM** | `src/app/demos/rag-pipeline/page.tsx` |
| Vector Search | Transformers.js, PCA, Canvas | **Browser WASM** | `src/app/demos/vector-search/page.tsx` |
| Multimodal | Florence-2, WebGPU + Transformers.js | **Browser WebGPU** | `src/app/demos/multimodal/page.tsx` |
| Quantization | ONNX Runtime, FP32 vs INT8 | **Browser WASM** | `src/app/demos/quantization/page.tsx` |
| LLM Router | Groq API | **Server** | `src/app/api/llm-router/` |
| Portfolio Assistant | Groq + RAG, Vercel AI SDK | **Server** | `src/app/api/portfolio-assistant/` |
| Resume Generator | Groq, Llama 3.3 70B | **Server** | `src/app/api/resume-generator/` |
| Multi-Agent | Groq, Analyzer+Researcher+Strategist | **Server** | `src/app/api/multi-agent/` |
| MCP Demo | MCP protocol, Groq tool calling | **Server** | `src/app/api/mcp-demo/` |

---

## Critical Rules (NEVER violate these)

- **NEVER touch server-side demos** when fixing browser-WASM/mobile issues. They are independent.
- **ALWAYS use `useBrowserAI` hook** (`src/hooks/useBrowserAI.ts`) for any demo that loads WASM or WebGPU. Never load models unconditionally.
- **NEVER modify** `vercel.json` headers or the CSP in `next.config.ts` unless that is the explicit task. These are fragile — wrong changes break all 4 browser demos.
- **ALWAYS run `npx tsc --noEmit`** after any code change. Zero TypeScript errors required before commit.
- **NEVER expose secrets** — no API keys, no Redis connection strings in client-side code or public files.
- **Surgical changes only** — each prompt session targets specific identified gaps. Do not refactor working code unless asked.
- When fixing mobile issues: add simulated fallback paths, never remove the real desktop inference path.
- ALWAYS add rate limiting to new API routes via `enforceRateLimit` from `src/lib/api.ts`
- ALWAYS add observability (`startTimer`, `logAPIEvent`) to API routes
- ALWAYS add input validation (length + type checks) at route entry
- ALWAYS run input through `enforceGuardrails` (or at minimum `checkInput`) from `src/lib/guardrails.ts`
- ALWAYS sanitize LLM output with the existing guardrail sanitizer before rendering
- Run `npm run build` before committing — never commit broken builds
- Run `npm run test` — all tests must pass before every commit
- Run `npm audit --audit-level=high` — 0 high/critical vulnerabilities required

---

## Security Scope
- DO NOT read, write, or reference .env files
- DO NOT expose API keys or credentials in any output
- DO NOT execute shell commands that write outside
  designated temp directories
- Skill execution is scoped to documentation and source
  code understanding only

---

## Coding Conventions

- TypeScript strict mode throughout — no `any`, no `ts-ignore` without a comment explaining why
- All demo pages must have `'use client'` at top
- Functional components only, no class components
- No default exports — use named exports everywhere
- State management: React `useState`/`useEffect` only — no Redux, no Zustand
- Tailwind utilities only — no custom CSS files, no styled-components
- All LLM outputs rendered as React text nodes (`{text}`) — never `dangerouslySetInnerHTML` without an explicit vetted HTML sanitizer
- `react-hooks/set-state-in-effect` ESLint rule fires on synchronous `setState` inside `useEffect` — use `// eslint-disable-next-line` when the pattern is intentional

---

## Key Shared Utilities

- `src/hooks/useBrowserAI.ts` — mobile/memory detection for all browser-WASM demos. Pass `true` for WebGPU-required demos (Multimodal).
- `src/components/BrowserAIWarning.tsx` — warning banner component, used by all 4 browser demos
- `src/data/profile.json` — Single source of truth for all profile data
- `src/lib/rate-limit.ts` — Rate limiting (ALWAYS use on new API routes)
- `src/lib/observability.ts` — Structured logging, anomaly detection, trace propagation
- `src/lib/guardrails.ts` — Injection detection, competitor filtering, hallucination heuristics, `enforceGuardrails`
- `src/lib/eval-engine.ts` — LLM-as-Judge scoring (`scoreResponse`, `runEvals`)
- `src/lib/drift-monitor.ts` — Model output drift detection (`trackModelOutput`, `getDriftSnapshot`)
- `src/lib/cost-control.ts` — Per-route token cost tracking
- `src/lib/hitl.ts` — Human-in-the-loop checkpoint utilities
- `src/lib/api.ts` — Shared route utilities (`enforceRateLimit`, `jsonError`, etc.)
- `src/app/layout.tsx` — Root layout, metadata, JSON-LD schema
- `src/proxy.ts` — Edge middleware: security headers, .html redirects

---

## Adding a New Demo
Short version: `src/app/demos/[name]/page.tsx` + `src/app/api/[name]/route.ts` +
rate-limit + observability + guardrails + input validation + unit tests + E2E smoke test.

**IMPORTANT:** Also add the new demo `id` to the `DEMO_GROUPS` array in
`src/components/sections/AITools.tsx` — the homepage grid will silently skip
demos that are in `demos.ts` but not in that array.

For browser-WASM demos: wire `useBrowserAI` hook and `BrowserAIWarning` component,
add simulated fallback path for mobile/low-memory devices.

---

## Test Commands
- `npm run test` — unit tests (must pass before every commit)
- `npm run test:coverage` — coverage report (gates: global ≥80% branches; api ≥90% stmts / ≥85% branches; lib ≥95% functions)
- `npm run test:fuzz` — adversarial tests
- `npm run test:evals` — LLM-as-Judge eval suite
- `npm run test:e2e` — Playwright (chromium, firefox, webkit, mobile; requires built server)

---

## Architecture Constraints

- **Vercel deployment** — static + edge functions only. No long-running processes.
- WASM headers (`COOP`, `COEP`, `blob:` CSP) are set in `next.config.ts` AND `src/proxy.ts`. Both must be consistent.
- `public/.well-known/ai-agent-manifest.json` — AI recruiter manifest. Keep valid JSON after any edit: `node -e "JSON.parse(require('fs').readFileSync('public/.well-known/ai-agent-manifest.json','utf8'))"`
- No legacy `.html` files in `public/` — Next.js serves them verbatim. Delete any found.
- `profile.personal.title` = "VP / Head of AI Engineering" — do not change without updating `layout.tsx`
- All URLs use `https://www.prasadkavuri.com` (with www) — be consistent

---

## Enterprise Control Plane Demo

**Route**: `/demos/enterprise-control-plane`
**API**: `/api/enterprise-sim`
**Components**: `src/components/enterprise/`

All data is simulated via `src/lib/enterpriseMockData.ts` — deterministic seeded generation, no external API calls.
Token pricing: Input $3/MTok | Output $15/MTok | Cache read $0.30/MTok | Cache write $3.75/MTok (Anthropic API, April 2026).
To add new teams: edit `src/lib/enterpriseMockData.ts`. Types in `src/components/enterprise/types.ts`.

---

## Security Posture
CSP (`next.config.ts` + `proxy.ts`), middleware and route rate limiting,
prompt injection detection, competitor mention redaction, hallucination heuristics,
regex-based LLM output sanitization, input validation, IP SHA-256 hashing, HITL checkpoint (multi-agent), eval
regression gate in CI, `npm audit` in CI.
See README security table and `/governance` page for full inventory.

---

## What Not To Do (learned from past sessions)

- Do not re-introduce `blob:` CSP errors by overwriting `vercel.json` — this broke all 4 WASM demos previously
- Do not raise Redis rate-limit keys with raw IPs — always SHA-256 hash before storage
- Do not set `dangerouslySetInnerHTML` on LLM output without an explicit vetted HTML sanitizer
- Do not add `.html` files to `public/` — they get indexed by Google as separate pages
- Do not change the copyright year manually — it is dynamic
- Do not use `getByText(regex)` in Playwright without `.first()` — nav/footer links cause strict-mode violations
- Do not skip the `useBrowserAI` hook on new browser-WASM demos — mobile will silently hang
- Do not remove the `@AGENTS.md` reference from the top of this file
