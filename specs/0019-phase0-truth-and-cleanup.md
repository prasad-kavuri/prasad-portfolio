# SPEC-0019: Phase 0 — truthful claims, demo consolidation, discoverability consistency

**Status**: Implemented
**Date**: 2026-09-23

## What

The first phase of the Sept 23 strategic-audit plan (Claude + Astra 6 reconciliation), repositioning the
portfolio for VP AI Platform roles:

1. **Retire four demos** that are least relevant to enterprise agent-platform leadership: Native Browser AI
   Skill, Multimodal Assistant, standalone Vector Search, and AI Hiring Intelligence (resume generator).
   Their pages, API route, and tests are deleted; old URLs 301-redirect to the nearest relevant page.
   The MCP `calculate_fit_score` tool is removed with the hiring tool.
2. **Regroup the remaining 13 demos** into two executive tiers plus Labs, defined once in
   `src/data/demo-groups.ts` and consumed by the homepage grid, `/demos`, and the agent marketplace — so a
   demo can never again be registered but missing from a gallery (the bug that hit `storm-research` and then
   `generative-ui`).
3. **Correct claims the code does not support**: "CrewAI-powered" (no CrewAI in this repo or the HF Space
   backend), "ChromaDB"/"nomic-embed-text" (RAG uses all-MiniLM-L6-v2 over an in-memory index), "Vercel AI
   SDK" (not a dependency), "LLM-as-Judge" (scoring is deterministic rubric/keyword coverage), the hard-coded
   `regressionDelta`, the "4-bit MoE" quantization outcome, and stale model names.
4. **One attribution per headline metric**, matching `profile.json` (confirmed by the owner):
   50% latency reduction + 40% cost savings at Krutrim via multimodal agentic architecture and intelligent
   model routing; 70% infrastructure cost reduction at Ola via a cloud-native architectural overhaul.
5. **Discoverability consistency**: counts, lists, layer names, and dates in `llms.txt`, `llms-full.txt`,
   the AI-agent manifest, `entity.json`, JSON-LD, README, AI-AGENT.md; remove keyword-stuffing "recruiter
   query match" lists and Director-level phrasing; add missing sitemap entries; delete the shadowed
   `public/robots.txt`; update Google ecosystem naming (Agent Runtime / Gemini Enterprise Agent Platform).
6. **Drift test**: a Vitest invariant that fails if any public inventory disagrees with `demos.ts`.

## Why

Two independent audits (Claude, Astra 6; 2026-09-23) agreed that credibility gaps and inventory drift
matter more than breadth, and recommended consolidation. Owner decisions: target VP AI Platform; remove the
hiring tool; execute Phase 0.

## Scope boundaries

- In scope: the six items above.
- Out of scope (later phases): server-enforced approvals, per-tool MCP scopes, real MCP/A2A endpoints,
  trajectory evaluation, the flagship rebuild, Portfolio Assistant → site widget conversion (it moves to
  Labs for now because the RAG demo uses its API as a mobile fallback), Zip entity disambiguation and any
  Zip wording changes (pending owner confirmation of what is public), resume PDF regeneration.

## Open questions

- What can be said publicly about Zip (URL, "regulated financial services", Google stack) — unchanged here.
- `public/prasad-kavuri-vp-ai-engineering-2026.pdf` still needs regenerating after `resume.md` wording fixes.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npx vitest run`
- `npm run build`
