# SPEC-0020: Phase 1 — enforce the agent-platform controls the demos describe

**Status**: Implemented
**Date**: 2026-09-23

## What

Make the governance controls the portfolio claims actually enforced on the server, with negative-path
tests that prove it:

1. **Server-enforced human approval** (`src/lib/approvals.ts`). A consequential action is staged as a
   pending approval with an unguessable id. Only a server-side decision can release it: single use
   (atomic take), 15-minute expiry, replay returns 409, and the receipt binds the decision to a SHA-256
   of exactly what was staged.
   - **Multi-Agent**: the Strategist's recommendation is staged after analysis; release happens only via
     `{ action: 'decide' }`. Reviewer edits are guardrail-checked and recorded on the receipt; auto mode
     is recorded as `approvalMode: 'auto'`. The old client-supplied `approvalState` is gone.
   - **Edge Agent**: two-step flow. `stage` re-checks the browser-redacted payload for structured PII
     (email, phone, SSN, card, account) and returns 422 if any remains; `approve` sends only the staged
     payload to the cloud model; `reject` consumes the approval. The old `approvedByUser: true` flag is
     rejected.
2. **Per-tool authorization with default deny** (`src/lib/tool-policy.ts`). `get_experience` and
   `search_skills` are public; `get_achievements` requires the `read:profile` scope from the auth.md
   credential. Unknown tools are denied. Denials are visible in the tool-call log and returned to the
   model as a bounded result.
3. **Tool-poisoning defense** (`screenToolOutput`). Tool results and remote-agent outputs are screened
   with the injection signatures before reaching a model or a user; failures are withheld and logged.
4. **Daily spend caps** (`enforceDailyBudget`). 500 LLM calls per route per UTC day (503 "paused for
   today") and 60 per client across routes (429), overridable via env. Applied to every Groq/HF route.
5. **Fail-closed signing secret**. In production, missing `AGENT_AUTH_SECRET` returns 503 from
   `/api/agent-auth` (and MCP treats Bearer tokens as unauthenticated) instead of signing with the public
   dev secret. Signature comparison is constant time.

## Why

Both Sept 23 audits (Claude, Astra 6) found that approval, tool authorization, and evaluation were
narrated rather than enforced. Owner decisions: proceed with Phase 1; `get_achievements` is the scoped
tool; 500 calls/day per route; `AGENT_AUTH_SECRET` is set in Vercel production.

## Scope boundaries

- In scope: the five items above, UI updates to show server state (receipts, denied/blocked calls,
  server PII re-check), negative-path tests, copy updates in discovery files.
- Out of scope (Phase 2): real MCP JSON-RPC endpoint, A2A Agent Card and service, trajectory evaluation,
  approver identity distinct from requester (in this public demo the visitor is the approver — stated in
  the UI), durable multi-day tasks, OpenTelemetry spans.
- Known limitation: the Multi-Agent HF backend computes all three stages in one call; the platform gates
  the *release* of the Strategist's recommendation, not its computation.

## Verification

- `npx tsc --noEmit`, `npm run lint`, `npm run test:coverage` (thresholds met), `npm run build`
- Negative paths covered: forged/mis-scoped credentials, unknown tools, poisoned tool and agent output,
  client-asserted approval, replayed / expired / malformed / cross-workflow approval ids, PII left in a
  "sanitized" payload, unsafe reviewer edits, route and per-client budget exhaustion, missing signing
  secret in production.
