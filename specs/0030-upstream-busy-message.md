# SPEC-0030: Say "busy" when Groq rate-limits a demo

**Status**: Implemented (pending live verification after deploy)
**Date**: 2026-10-18

## What

When Groq answers a demo request with HTTP 429 (its rate limit), every Groq-backed route returns a clear 429 with
"The demo is busy right now. Please try again in a minute." instead of a generic 500/502/"Research failed".
The two demo pages that hid the server's message (homepage assistant, MCP demo) now show it.

## Why

On 2026-10-18 storm-research failed at its last step when run straight after other demos, and succeeded twice when
run a minute apart. That fits Groq's free-plan limit of 8,000 tokens a minute, and storm-research makes about six
calls per click. Visitors who hit the limit saw "Research failed" or "Failed to get response", which reads as a broken
site. A 429 is a normal, temporary condition and should read as one.

## Decisions

- `src/lib/groq-models.ts` gets `UPSTREAM_BUSY_MESSAGE` and `isUpstreamBusy(status)` / `isUpstreamBusyError(error)`
  (fetch responses and SDK errors).
- Routes that already inspect the upstream status (llm-router, generative-ui, portfolio-assistant) return
  `jsonError(UPSTREAM_BUSY_MESSAGE, 429)` and log a warning (`api.upstream_busy`), not an error.
- SDK routes (mcp-demo, edge-agent) check the caught error. Storm-research's helper throws an error carrying the
  status, and the stream sends the busy message as its `error` line.
- No retry or queueing. Retrying inside a request would extend latency and spend more of the same limited budget.
- Our own per-IP rate limiter (`enforceRateLimit`) is not touched.

## Scope boundaries

- In scope: the six routes, the shared helper, `portfolio-assistant/page.tsx` and `mcp-demo/page.tsx` (show the
  server message), tests.
- Out of scope: edge-agent consumes its approval before calling Groq, so a 429 there means the visitor must stage the
  handoff again; changing that is a separate decision. No change to token limits or the Groq plan.

## Evidence to reuse

`src/lib/groq-models.ts` (`sdkErrorParts`), `jsonError`, `logApiWarning`, existing route tests.

## Open questions / [NEEDS CLARIFICATION]

- The 8,000 tokens/minute cause is inferred from timing, not read from a log. The new `api.upstream_busy` warning
  will show how often it happens.

## Verification

- `npx tsc --noEmit`, `npx eslint src`, `npx vitest run`, `npm run build`, `node scripts/audit-dependencies.mjs`
- Route tests: a 429 from Groq returns 429 with the busy message for each of the six routes.

Rollback: revert the commit; routes return to their previous generic errors.
