# SPEC-0004: Enterprise Capability Lifecycle narrative layer

**Status**: Draft
**Date**: 2026-07-07

## What

Add a vendor-neutral "Enterprise Capability Lifecycle" diagram and short explainer to the `/capabilities`
page, and add a one-sentence lifecycle-stage breadcrumb to the other Platform pages (`/skills`,
`/enterprise-agent-runtime`, `/ai-runtime-engineering`, `/adaptive-ai-governance`, `/ai-finops`,
`/governance`, `/agent-marketplace`) so each page states which stage(s) of the lifecycle it implements
and links back to `/capabilities`. Also fix `/skills` being unreachable from primary navigation.

This is a narrative and navigation layer on top of existing content — no new route, no new data model,
no change to demos or API routes.

## Why

An architectural review (see conversation / delivered report `architecture-review-capability-lifecycle.md`)
found that the repo already implements most stages of a capability lifecycle (authoring, versioning,
registry, runtime enforcement, execution, observability, feedback) across eight separate pages, but never
states the lifecycle as a connected sequence. `/skills` was also found to have zero internal links anywhere
in `src/`, making it unreachable via site navigation. The fix is to name and sequence what already exists,
not to build new capability infrastructure.

## Scope boundaries

- In scope:
  - New SVG diagram asset (`public/capability-lifecycle-diagram.svg`), styled consistently with
    `public/architecture-diagram.svg`.
  - New lifecycle section on `/capabilities` (diagram + explainer paragraph + stage-to-page mapping).
  - One-sentence breadcrumb + link back to `/capabilities#lifecycle` added to the header of: `/skills`,
    `/enterprise-agent-runtime`, `/ai-runtime-engineering`, `/adaptive-ai-governance`, `/ai-finops`,
    `/governance`, `/agent-marketplace`.
  - Add `/skills` to `platformLinks` in `Navbar.tsx`.
  - Short new section in `docs/ARCHITECTURE.md` referencing the new diagram, per the existing "Diagram
    Ownership" convention.
- Out of scope (this pass):
  - Reordering the full `Navbar.tsx` `platformLinks` sequence (Phase 2 — separate spec).
  - Live/dynamic capability registry data on the diagram (Phase 3 — separate spec).
  - Any change to `enterprise-ai-operating-model` (already the executive-framing page; lifecycle language
    can be added there in a later pass if useful, not required now).
  - No changes to CSP, security headers, rate limits, auth, or demo registry entries.

## Evidence to reuse

- `src/app/capabilities/page.tsx` — existing `Card` grid pattern, `capabilitiesStructuredData` JSON-LD
  pattern to extend (or add a second `ItemList`/`HowTo`-style block for the lifecycle stages).
- `public/architecture-diagram.svg` — visual style reference (dark gradient bg, accent gradient stroke,
  pill-shaped nodes, arrow markers) for the new lifecycle SVG, kept as a separate file per existing
  "Diagram Ownership" convention (one artifact = one concern).
- `docs/ARCHITECTURE.md` "Diagram Ownership" section — pattern for documenting a canonical diagram file.
- Existing page-header pattern (`<p className="text-xs font-semibold uppercase tracking-widest ...">` eyebrow
  + `<h1>` + intro paragraph) repeated identically across all six Platform pages — the breadcrumb is a small
  addition inside this existing block, not a new component.

## Open questions / [NEEDS CLARIFICATION]

- Exact stage-to-page mapping wording (e.g., is `/skills` "Capability Authoring" alone, or also
  "Capability Registry"?) — will draft based on actual page content and confirm in the diff.
- Whether `/agent-marketplace` should map to "Execution" only, or "Execution + Observability" since demos
  surface some live metrics — will default to "Execution" and note the overlap rather than guess further.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/app/capabilities/page.tsx src/app/skills/page.tsx src/app/enterprise-agent-runtime/page.tsx src/app/ai-runtime-engineering/page.tsx src/app/adaptive-ai-governance/page.tsx src/app/ai-finops/page.tsx src/app/governance/page.tsx src/app/agent-marketplace/page.tsx src/components/layout/Navbar.tsx`
- `node -e "require('fs').readFileSync('public/capability-lifecycle-diagram.svg','utf8')"` (valid file exists)
- `npm run build` (isolated copy if `.next` is permission-locked)
