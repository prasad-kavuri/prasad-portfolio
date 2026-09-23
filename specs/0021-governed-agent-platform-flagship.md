# SPEC-0021: Phase 2 — Governed Agent Platform flagship (A2A v1.0 + MCP + gateway + release gate)

**Status**: Implemented
**Date**: 2026-09-23

## What

Replace the "narrated" flagship with one enterprise task that runs end to end on real, standards-based
endpoints any external agent can call:

1. **Real MCP server** — `POST/GET/DELETE /api/mcp`, built on the official
   `@modelcontextprotocol/sdk` (spec 2025-11-25), Streamable HTTP, stateless, JSON responses. Profile
   tools (`get_experience`, `search_skills`, `get_achievements`) come from `src/lib/profile-tools.ts`
   with zod input schemas and `readOnlyHint`. Every call goes through the tool gateway; a missing scope
   returns `isError` plus `_meta.gateway`. An invalid Bearer returns 401 with a
   `WWW-Authenticate … resource_metadata=…/.well-known/oauth-protected-resource` header.
2. **Real A2A agent** — `POST /api/a2a`, built on the official `@a2a-js/sdk` (A2A v1.0, JSON-RPC
   binding: `SendMessage`, `GetTask`). The `A2A-Version: 1.0` header is required (absent → 0.3 → 400
   VERSION_NOT_SUPPORTED). Agent Card at `/.well-known/agent-card.json` is generated from
   `src/lib/a2a/agent-card.ts` (a test asserts they are identical). Tasks persist in a durable
   Upstash-backed `TaskStore` (1 h TTL) so a task can pause and resume across serverless invocations.
   Streaming and task listing are not offered.
3. **Tool gateway** (`src/lib/tool-gateway.ts`) — one choke point: authorize (default deny, per-tool
   scopes, approval reference for consequential tools) → execute → screen output for injection → emit
   a span (tool, principal, decision, reason, latency). Reads run as the calling user; the release runs
   as the agent's own service principal (`agent:payment-exception-agent`), so both identities appear in
   the trace.
4. **Flagship scenario** (fictional Northwind Finance data, `src/data/flagship-scenarios.ts`) — a
   payment-exception agent: PX-1001 released under policy; PX-1002 ($48.5k logistics) stops in
   `INPUT_REQUIRED` for human approval; PX-1003 blocked as a duplicate; PX-1004 vendor record carries a
   prompt injection, which the gateway withholds and the agent escalates.
5. **Fail-closed resume** — a decision can only be applied to a review that is actually awaiting
   approval, and only by a caller whose credential has `finance:sandbox`. An `AUTH_REQUIRED` or finished
   task can never be "approved" into a release (→ `REJECTED` / `invalid_state`); an unauthenticated
   approval leaves the task in `INPUT_REQUIRED`. Terminal tasks reject further messages (no replay).
6. **Trajectory evaluation + release gate** (`src/lib/flagship/trajectory-eval.ts`,
   `GET /api/flagship/release-gate`) — v1 and a v2 candidate (which skips the duplicate check) are
   scored on the golden set: exact/in-order trajectory match, tool precision/recall, outcome accuracy,
   safety violations. v2 releases a duplicate → safety violation → rollback of the 10% canary.
7. **Demo page** `/demos/governed-agent-platform` — Discover (card) → Identify (auth.md credential) →
   Delegate (A2A task, with/without credential, gateway trace, approve/reject) → Evaluate & release.
   Registered first in `src/data/demos.ts` and set as `SIGNATURE_DEMO_ID`; discovery files (llms.txt,
   llms-full, manifest, entity.json, resume.md, README, AI-AGENT.md, sitemap, ai-profile.json) updated
   to 14 demos with an AGENT ENDPOINTS section. New scope `finance:sandbox` added to `DEMO_SCOPES`.

## Why

The Phase 0/1 audits found the portfolio described agent-platform controls it did not run. For a VP AI
Platform audience the strongest signal is one governed workflow that a reviewer — or their own agent —
can exercise over MCP and A2A, including the failure paths. Owner decisions: official SDKs; Phase 2
before Phase 3; nothing unverified goes live.

## Scope boundaries

- In scope: items above, tests, docs.
- Out of scope: streaming/push notifications, task listing, OAuth authorization server (credentials come
  from the existing auth.md flow), separate approver identity (in this public demo the visitor who
  starts the task may also approve it — stated in the UI), OpenTelemetry export.
- Known limitations: `GetTask` is readable by anyone holding the (unguessable UUID) task id; MCP clients
  make several requests per session against the shared 10/min route rate limit; without Upstash env
  vars the task store falls back to per-instance memory.

## Verification

- `npx tsc --noEmit`, `eslint` (0 errors), `vitest --coverage` (1163 tests, thresholds met),
  `npm audit --audit-level=high` (0), `next build`.
- Local `next start` smoke: Agent Card 200; MCP initialize + scoped denial; A2A version enforcement;
  PX-1002 INPUT_REQUIRED → unauthenticated approve stays INPUT_REQUIRED → authenticated approve
  COMPLETED; AUTH_REQUIRED task + approve → REJECTED; replay to terminal task rejected.
