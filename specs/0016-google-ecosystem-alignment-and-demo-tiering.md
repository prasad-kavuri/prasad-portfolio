# SPEC-0016: storm-research card-rendering bug fix, Google agent-platform alignment content, demo tiering

**Status**: Implemented
**Date**: 2026-09-20

## What

Three related changes, all originating from comparing two independent strategic audits (one done in
this session, one done by ChatGPT and supplied by the user as `AI_Portfolio_Demo_Relevance_Audit.md`):

1. **Bug fix**: the `storm-research` demo (registered in `src/data/demos.ts`) is missing from
   `DemosGallery.tsx`'s `GROUPS` array, so its card never renders on the live `/demos` page even though
   the page header says "16 Production AI Modules." This is the real, verified root cause of the "15 vs
   16" count discrepancy the ChatGPT audit flagged (it misdiagnosed the cause as `demos.ts` itself having
   only 15 entries — that file has 16, confirmed by direct read and grep). `agent-marketplace.tsx` has a
   related but lesser gap: `storm-research` is missing from its `DEMO_ICONS`/`DEMO_CAPABILITIES` maps, so
   it still renders (the marketplace maps over all demos unconditionally) but with a generic icon and no
   capability tags, making it invisible under every filter except "All Agents."
2. **Content addition**: neither audit's underlying finding — that the portfolio has zero explicit
   vocabulary linking its governance work to Google's enterprise agent-platform ecosystem (ADK, Agent
   Engine, Agentspace/Gemini Enterprise Agent Platform, Agent Identity, Agent Registry, Agent Gateway, A2A
   protocol, Model Armor, current MCP spec) — is currently addressed anywhere in the repo. Add a mapping
   section to `/enterprise-agent-runtime` (the page that already documents these concerns in portfolio
   terms) plus one cross-reference sentence on the Agent Auth demo page.
3. **Display reorg**: regroup the demo grid on `/demos` and the homepage into a "Primary" tier (12 demos)
   and a new "Technical Explorations" tier (4: Vector Search, Multimodal Assistant, Model Quantization,
   Native Browser AI Skill) — narrower-audience, higher-maintenance demos with the least distinct
   enterprise-platform story per both audits. Total demo count stays 16 everywhere; this is a display/IA
   change only, not a removal, so no sitemap/JSON-LD/`llms.txt`/manifest changes are needed.

## Why

User asked for a comparison of this session's read-only strategic audit against a second, independently
produced audit (`AI_Portfolio_Demo_Relevance_Audit.md`), then chose "narrative/framing pass only" (no new
demo engineering, no A2A protocol build, no unified flagship rebuild) with a 12–13 visible demo target,
rest moved to a secondary tier — explicitly declining the more ambitious options (full flagship rebuild,
real two-agent A2A delegation demo). Both audits agreed the core gap is vocabulary/framing, not technical
depth. The `storm-research` bug was found independently while investigating the ChatGPT audit's count
claim and is a genuine, verified defect worth fixing regardless of the framing work.

## Scope boundaries

- In scope: the three items above.
- Out of scope (this pass, per explicit user choice): building a new Agent Trajectory Evaluation module,
  a real A2A two-agent delegation demo, a unified "Governed Enterprise Agent Platform" mega-flagship
  experience, or any change to `demos.ts` entries/registry, sitemap, JSON-LD, `llms.txt`, or the AI-agent
  manifest (total count is unchanged, so none of these need touching).
- Not fixed this pass (noted, not actioned per "surgical changes only"): `agent-marketplace.tsx`'s
  `DEMO_CAPABILITIES` map is thin for several demos beyond just `storm-research`; a fuller capability-tag
  pass there is a separate, smaller follow-up if ever wanted.

## Evidence to reuse

- `AITools.tsx`'s `DEMO_GROUPS` already includes `storm-research` correctly — used as the reference for
  the DemosGallery.tsx fix.
- `enterprise-agent-runtime/page.tsx`'s existing `concerns` array and Card-grid pattern — the new mapping
  section follows the same visual pattern as a separate array/section, not a rewrite of `concerns`.
- `agent-auth/page.tsx`'s existing "Why this matters" panel (already extended once in SPEC-0015) — one
  more sentence in the same panel, same pattern.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/components/sections/DemosGallery.tsx src/components/sections/AITools.tsx src/app/agent-marketplace/page.tsx src/app/enterprise-agent-runtime/page.tsx src/app/demos/agent-auth/page.tsx`
- `npx vitest run` (full suite — these components are covered by existing DemosGallery/AITools tests)
- `npm run build` (isolated `/tmp` copy per this repo's established sandbox workflow)
- Manual: confirm `storm-research` href present in DemosGallery's rendered output count logic (16 total
  across groups) and in agent-marketplace's capability-filtered views.
