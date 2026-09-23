---
name: prasad-portfolio
description: >
  Baseline security, CSP/WASM, and coding-convention invariants for the prasad-portfolio
  repository at prasadkavuri.com — the contract every code change here must satisfy,
  regardless of which other skill (add-demo, testing, security-review, etc.) is also in use.
  Use alongside a task-specific skill, or on its own for a small edit that doesn't need one.
---

# Prasad Portfolio — Agent Skill

This skill governs all AI-assisted work on the prasad-portfolio Next.js codebase.
It encodes the project's non-negotiable invariants, security rules, and coding conventions
so they are enforced consistently across Claude Code, Cowork, Cursor, Copilot, and any
other coding-agent workflow.

---

## Tech Stack (pinned — do not upgrade without explicit instruction)

- Next.js **16.2.6** (App Router + Turbopack) — no `^`, exact pin
- React 19.2.6 · TypeScript 6.0.3 · Tailwind CSS 4.2.4
- Groq SDK (server-side LLM) · @huggingface/transformers v4 (browser WASM)
- Upstash Redis (rate limiting) · Vitest + Playwright (testing)

**Don't assume standard Next.js/React/Tailwind patterns hold for these pinned versions.**
When touching a Next.js API you're not certain still behaves as trained (App Router routing,
middleware, Turbopack config), verify against `node_modules/next/dist/` rather than assuming.

---

## Demo Execution Modes

| Demo | Engine | Mode |
|------|--------|------|
| RAG Pipeline | Transformers.js all-MiniLM-L6-v2 | Browser WASM |
| Vector Search | Transformers.js + PCA + Canvas | Browser WASM |
| Multimodal | Florence-2, WebGPU + Transformers.js | Browser WebGPU |
| Quantization | ONNX Runtime FP32 vs INT8 | Browser WASM |
| LLM Router | Groq API | Server |
| Portfolio Assistant | Groq + RAG, Vercel AI SDK | Server |
| Resume Generator | Groq Llama 3.3 70B | Server |
| Multi-Agent | Groq, Analyzer+Researcher+Strategist | Server |
| MCP Demo | MCP protocol + Groq tool calling | Server |

**Never touch server-side demos when fixing browser-WASM/mobile issues — they are independent.**

---

## Critical Rules (never violate)

1. **useBrowserAI hook** — always use `src/hooks/useBrowserAI.ts` for any demo loading WASM or WebGPU. Pass `true` for WebGPU-required demos (Multimodal). Never load models unconditionally.
2. **CSP / security headers** — never modify `vercel.json` headers or the CSP in `next.config.ts` unless that is the explicit task. Wrong changes break all 4 browser demos.
3. **TypeScript strict** — run `npx tsc --noEmit` after every change. Zero errors required.
4. **No secrets in client code** — no API keys, Redis connection strings, or tokens in client-side code or public files.
5. **Surgical changes only** — do not refactor working code unless explicitly asked.
6. **Mobile fallback** — when fixing mobile issues, add simulated fallback paths; never remove the real desktop inference path.
7. **Rate limiting** — always add rate limiting to new API routes via `enforceRateLimit` from `src/lib/api.ts`.
8. **Observability** — always add `startTimer` + `logAPIEvent` from `src/lib/observability.ts` to API routes.
9. **Input validation** — always validate input (length + type checks) at route entry before any LLM call.
10. **Guardrails** — always run input through `enforceGuardrails` (or `checkInput`) from `src/lib/guardrails.ts`.
11. **Sanitize LLM output** — always sanitize with the guardrail sanitizer before rendering. Never use `dangerouslySetInnerHTML` on LLM output without a vetted HTML sanitizer.
12. **Build gate** — run `npm run build` before committing. Never commit broken builds.
13. **Test gate** — run `npm run test`. All tests must pass before every commit.
14. **Audit gate** — run `npm audit --audit-level=high`. Zero high/critical vulnerabilities required.

---

## Agent Operating Contract

For every non-trivial coding task, state before editing:

- **Assumptions**: what you believe is true, and what remains unknown.
- **Scope boundaries**: what is intentionally in and out of scope.
- **Files expected to change**: the smallest expected file set.
- **Verification commands**: exact commands that will prove the change.
- **Rollback notes**: for risky changes only — simplest way back.

### Anti-patterns (never do these)
- No drive-by refactors.
- No broad rewrites.
- No speculative abstractions.
- No touching CSP, security headers, auth, env handling, SSRF, rate limits, logging, or deployment config unless explicitly requested.
- No changing executive positioning, profile title, signature system, metadata, JSON-LD, llms files, entity files, or demo registry entries unless requested.

### Definition of Done
- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` passes.
- `npm audit --audit-level=high` passes with 0 high/critical vulnerabilities.
- Every changed line directly maps to the user's request.

---

## Architecture Rules

1. Rate-limit ALL new API routes using `enforceRateLimit` from `src/lib/api.ts`
2. Log ALL API requests using `startTimer` + `logAPIEvent` from `src/lib/observability.ts`
3. Validate ALL inputs at route entry (length, type, schema) — reject before LLM call
4. Run user input through `enforceGuardrails` from `src/lib/guardrails.ts`
5. Never add `output: 'export'` to `next.config.ts` — breaks API routes
6. Security headers live in BOTH `next.config.ts` AND `src/proxy.ts` — update both if needed
7. Middleware export is named `proxy` in `src/proxy.ts` (non-standard)

---

## Key Shared Utilities

| File | Purpose |
|------|---------|
| `src/hooks/useBrowserAI.ts` | Mobile/memory detection for all browser-WASM demos |
| `src/components/BrowserAIWarning.tsx` | Warning banner for all 4 browser demos |
| `src/data/profile.json` | Single source of truth for all profile data |
| `src/lib/api.ts` | `enforceRateLimit`, `jsonError`, `createRequestContext`, `finalizeApiResponse` |
| `src/lib/observability.ts` | `logAPIEvent`, `startTimer`, `detectAnomaly`, `generateClientTraceId` |
| `src/lib/guardrails.ts` | `enforceGuardrails`, `checkInput`, `checkOutput`, `sanitizeLLMOutput` |
| `src/lib/rate-limit.ts` | Upstash-backed rate limiting + SHA-256 IP hashing |
| `src/lib/eval-engine.ts` | `scoreResponse`, `runEvals` — LLM-as-Judge scoring |
| `src/lib/drift-monitor.ts` | `trackModelOutput`, `getDriftSnapshot` |
| `src/lib/cost-control.ts` | Per-route token cost tracking |
| `src/lib/hitl.ts` | Human-in-the-loop checkpoint utilities |

---

## File Structure

```
src/app/api/[name]/route.ts     — API routes
src/app/demos/[name]/page.tsx   — Demo pages ('use client' required)
src/data/profile.json           — Profile data (do not duplicate)
src/data/demos.ts               — Demo registry
src/components/sections/AITools.tsx — DEMO_GROUPS ids array (keep in sync with demos.ts)
src/__tests__/                  — Unit, integration, fuzz, evals, resilience
e2e/*.spec.ts                   — Playwright E2E tests
```

---

## Adding a New Demo

1. Create `src/app/demos/[name]/page.tsx` with `'use client'`
2. Create `src/app/api/[name]/route.ts` with rate-limit + observability + guardrails + input validation
3. Add entry to `src/data/demos.ts`
4. Add the demo `id` to `DEMO_GROUPS` in `src/components/sections/AITools.tsx`
5. For browser-WASM demos: wire `useBrowserAI` hook + `BrowserAIWarning`, add simulated fallback for mobile
6. Write unit tests + E2E smoke test

---

## Coding Conventions

- TypeScript strict mode — no `any`, no `ts-ignore` without an explanatory comment
- All demo pages must have `'use client'` at top
- Functional components only, no class components
- Named exports everywhere — no default exports
- State management: `useState`/`useEffect` only — no Redux, no Zustand
- Tailwind utilities only — no custom CSS files, no styled-components
- All LLM outputs rendered as React text nodes `{text}` — never `dangerouslySetInnerHTML` on raw LLM output

---

## Key Invariants

- `next` pinned to exact `16.2.6` — never add `^`
- `profile.personal.title` = "VP / Head of AI Engineering" — do not change without updating `layout.tsx`
- All URLs use `https://www.prasadkavuri.com` (with www) — be consistent
- New demos need entries in BOTH `src/data/demos.ts` AND `src/components/sections/AITools.tsx`
- SHA-256-hash IPs before storing in Redis — never store raw IPs
- `public/.well-known/ai-agent-manifest.json` must remain valid JSON after any edit
- No `.html` files in `public/` — Next.js serves them verbatim, breaking routing

---

## What Not To Do (learned from past incidents)

- Do not re-introduce `blob:` CSP errors by overwriting `vercel.json` — broke all 4 WASM demos
- Do not raise Redis rate-limit keys with raw IPs — always SHA-256 hash before storage
- Do not set `dangerouslySetInnerHTML` on LLM output without an explicit vetted sanitizer
- Do not add `.html` files to `public/` — they get indexed as separate pages
- Do not change the copyright year manually — it is dynamic
- Do not use `getByText(regex)` in Playwright without `.first()` — strict-mode violations
- Do not skip the `useBrowserAI` hook on new browser-WASM demos — mobile will silently hang

---

## Security Scope

- Agents must not read, print, copy, summarize, commit, or expose `.env*`, Vercel secrets, API keys, tokens, private logs, or local machine files.
- Agents are limited to repo-scoped source files only.
- Default to read-only mode unless the user explicitly requests a code change.
- Human approval required before changes touching security headers, auth, env handling, rate limits, SSRF, logging, or deployment config.
