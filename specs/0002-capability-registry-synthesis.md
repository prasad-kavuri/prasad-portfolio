# SPEC-0002: Capability Registry synthesis + Agent Skills format citation

**Status**: Draft
**Date**: 2026-07-07

## What

Two small, additive changes:

1. A "Capability Registry" synthesis section added to `/enterprise-agent-runtime`, explicitly naming and
   cross-linking the three registry-like artifacts that already exist separately in this repo (Skills
   Catalog, Tool/MCP Registry, Prompt Registry / Agent Lifecycle) as one logical architecture layer.
2. A citation of the open Agent Skills format (https://github.com/agentskills/agentskills) against the
   real `skills/*/SKILL.md` files in this repo, since they already conform to that spec structurally
   (folder + SKILL.md + YAML frontmatter with name/description).

## Why

An external review (ChatGPT-generated architecture prompt) correctly identified that industry convergence
around Agent Skills, MCP, workflow/prompt registries is a real trend worth reflecting — but proposed
building a fourth "Capability Registry" interactive demo, which would duplicate three things that already
exist (the Skills Catalog page, the Tool Registry tab, the Agent Lifecycle tab). The doc's own instruction
("reuse existing pages, prefer consolidation over adding pages") argues against that. This spec captures
the smaller, honest version: explain the relationship between what already exists, and accurately cite a
real, verifiable format match, rather than building new UI or new narrative claims.

## Scope boundaries

- In scope: one new section on an existing page; one disambiguation + one citation on `/skills`; matching
  `llms.txt`/`llms-full.txt` updates.
- Out of scope: a new "Capability Registry" page or demo; a "Workflow Library / Enterprise Playbooks"
  registry (doesn't exist and shouldn't be faked — noted as an honest gap, not built).

## Evidence to reuse

- `/skills` + `src/data/skills.ts` — application-level skills catalog (distinct from repo-level agent
  skills — this spec disambiguates the two rather than merging them).
- `src/lib/registry.ts` (`TOOL_REGISTRY`) + Tool Registry tab in `/demos/enterprise-control-plane`.
- Agent Lifecycle tab in `/demos/enterprise-control-plane` + `/enterprise-agent-runtime`.
- `skills/*/SKILL.md` (9 files) — real, already-conformant Agent Skills format instances.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/app/enterprise-agent-runtime/page.tsx src/app/skills/page.tsx`
- `npx vitest run` (targeted tests for both pages)
- `npm run build` (isolated copy)
