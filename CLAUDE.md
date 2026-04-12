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
- `src/lib/observability.ts` — Structured logging with anomaly detection
- `src/lib/api.ts` — Shared route utilities (enforceRateLimit, jsonError, etc.)
- `src/app/layout.tsx` — Root layout, metadata, JSON-LD schema
- `src/proxy.ts` — Edge middleware: security headers, .html redirects

## Critical Rules for Claude Code
1. ALWAYS add rate limiting to new API routes via `enforceRateLimit` from `src/lib/api.ts`
2. ALWAYS add observability (`startTimer`, `logAPIEvent`) to API routes
3. ALWAYS add input validation (length + type checks) at route entry
4. NEVER expose API keys to the browser
5. ALWAYS sanitize LLM output with DOMPurify before rendering as HTML
6. Run `npm run build` before committing — never commit broken builds
7. Run `npm run test` — all tests must pass before every commit
8. Run `npm audit --audit-level=high` — 0 high/critical vulnerabilities required

## Adding a New Demo
Short version: `src/app/demos/[name]/page.tsx` + `src/app/api/[name]/route.ts` +
rate-limit + observability + input validation + unit tests + E2E smoke test

## Test Commands
- `npm run test` — unit tests (must pass before every commit)
- `npm run test:coverage` — coverage report (gates: api ≥90%, lib ≥95%)
- `npm run test:fuzz` — adversarial tests
- `npm run test:e2e` — Playwright (requires built server)

## Security Posture
CSP (next.config.ts + proxy.ts), rate limiting, prompt injection detection,
XSS sanitization, input validation, IP SHA-256 hashing, `npm audit` in CI.
See README security table for full inventory.
