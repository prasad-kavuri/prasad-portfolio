# SPEC-0003: Adaptive AI Governance — sharper threat-model messaging

**Status**: Draft
**Date**: 2026-07-07

## What

Text-only refinement to `/adaptive-ai-governance`: replace the earlier framing ("multi-agent systems have
already defeated static safety layers") with sharper, person/tool-neutral language about why governance
must be continuous rather than request-level, and add an honest split between what the platform's risk
classifier actually does today (request-level classification) and the broader enterprise agentic threat
model it does not yet cover (tool abuse, memory poisoning, MCP misuse, cross-agent coordination, workflow
escalation, data exfiltration, etc.).

## Why

A structured review of an earlier draft of this messaging (shared by the user, evaluating my own prior
commentary on an external red-teaming tool) correctly flagged two things: (1) don't name specific offensive
tools/people — no upside, real reputational risk for an executive-trust-focused portfolio; (2) don't
overstate what's built — the current risk-classifier operates at request/routing time, not across a running
agent's full execution (tool calls, memory reads/writes, delegation). This spec captures the messaging fix
only. Actually building execution-level, step-by-step governance is separate, larger work (see the review's
suggested continuous-governance loop) and is explicitly out of scope here.

## Scope boundaries

- In scope: hero copy and one new card on `/adaptive-ai-governance`, listing the fuller threat model
  honestly split into "what this platform enforces today" vs. "the broader threat model this points toward."
- Out of scope: any change to `risk-classifier.ts` logic or scope; no new demo; no execution-level/continuous
  enforcement (would require hooking policy checks into every step of a long-running agent — a real build,
  not a content edit, and a candidate for its own future spec if pursued).

## Evidence to reuse

- Existing `src/lib/risk-classifier.ts` and its live wiring into `/demos/llm-router` — described accurately,
  not overstated.
- Existing HITL evidence (`/demos/multi-agent`, `/demos/edge-agent-collaboration`) for the "human approval"
  half of the continuous-governance story.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/app/adaptive-ai-governance/page.tsx`
- `npx vitest run src/__tests__/components/AdaptiveAIGovernancePage.test.tsx`
- `npm run build` (isolated copy)
