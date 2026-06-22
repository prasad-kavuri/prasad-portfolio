# ADR-0001: LLM API calls are server-only — never from the browser

**Status**: Accepted  
**Date**: 2026-06

## Context

The portfolio has two inference paths: browser demos (WASM/WebGPU) and server demos (Groq API). A developer adding a new AI feature might naturally reach for a client-side `fetch` to the Groq API — it's simpler and removes a Vercel function cold start.

## Decision

All Groq (and any third-party LLM) API calls run exclusively in Vercel serverless functions (`src/app/api/*/route.ts`). No API key is ever present in browser-executed code.

## Alternatives considered

- **Direct browser fetch to Groq**: Simpler, no function cold start. Rejected because it exposes the API key in the browser, enables unlimited cost abuse, and bypasses all guardrail, rate-limit, and observability infrastructure.
- **Environment variable with `NEXT_PUBLIC_` prefix**: Would work technically but intentionally makes the key public. Rejected for the same reason.

## Consequences

- Every server demo requires an API route with `enforceRateLimit` + `enforceGuardrails` + `logAPIEvent`.
- Browser demos use WASM/WebGPU only — they never call an external LLM API.
- The `useBrowserAI` hook exists specifically to enforce this separation on mobile/low-memory devices.
