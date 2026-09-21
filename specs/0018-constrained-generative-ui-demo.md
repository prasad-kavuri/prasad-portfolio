# SPEC-0018: Constrained generative-UI demo (catalog + schema validation)

**Status**: In Progress
**Date**: 2026-09-21

## What

A new demo, `/demos/generative-ui`, where a visitor asks a natural-language question about Prasad's
background (e.g. "compare his roles at Krutrim and HERE") and the response renders as structured UI
(stat tiles, a comparison table, a timeline, a skill list) rather than free-text or raw HTML. The model
never emits markup — it can only choose from a small, developer-defined catalog of component types with
fixed prop shapes; the server validates the model's JSON against that catalog before returning it, and
the client renders it through a fixed switch of known components. Anything that doesn't validate is
rejected server-side and the UI falls back to a plain-text answer.

## Why

Prompted by a look at Vercel's `json-render` (AI → JSON → UI, constrained to a developer-defined
component catalog, Zod-validated). The pattern is directly relevant to this portfolio: it's a Next.js
site on Vercel already doing server-side Groq calls with guardrails, and "safe generative UI" is a
concrete, demoable instance of the security + AI-engineering-discipline positioning the whole site is
built around, distinct from the existing free-text demos.

## Scope boundaries

- In scope: one API route (`/api/generative-ui`), one lib file defining the component catalog and its
  validators, one small renderer component, one demo page, registry entries in `demos.ts` +
  `AITools.tsx`, unit tests for the catalog validators.
- Out of scope (this pass): streaming/progressive rendering (json-render's `SpecStreamCompiler`
  equivalent), a multi-framework renderer, Playwright E2E coverage, editing any other demo.
- Explicit dependency decision: no new npm dependency (no `zod`). The repo already has a working,
  reviewed convention for this exact problem — hand-written type-guard validators
  (`isResumeResponse` etc. in `src/app/api/resume-generator/route.ts`). This demo follows that same
  convention (`isUiSpec`/`isUiNode` guards in the new catalog file) rather than introducing a schema
  library, consistent with ADR-0010's minimal-dependency stance and the "simplicity first" rule.

## Evidence to reuse

- Route shape (rate limit → parse body → validate/sanitize input → guardrails → Groq call → parse →
  validate output → sanitize → respond): `src/app/api/resume-generator/route.ts`.
- Shared utilities: `enforceRateLimit`, `createRequestContext`, `finalizeApiResponse`, `readJsonObject`,
  `jsonError`, `captureAndLogApiError`, `logApiEvent`/`logApiWarning` from `src/lib/api.ts`;
  `detectPromptInjection`, `checkInput`, `sanitizeLLMOutput` from `src/lib/guardrails.ts`.
- Demo registry conventions: `src/data/demos.ts` (cloud-only demo shape, see `resume-generator` entry),
  `src/components/sections/AITools.tsx` (`DEMO_GROUPS`, `DEMO_ICONS`).
- Test conventions: `src/__tests__/lib/*.test.ts`.

## Open questions / [NEEDS CLARIFICATION]

None — scoped to a fixed catalog of 4 component types (stat tile, comparison table, timeline, skill
list) drawn from `src/data/profile.json`, which is enough to demonstrate the pattern without expanding
surface area.

## Verification

- `npx tsc --noEmit`
- `npx eslint src/lib/generativeUiCatalog.ts src/app/api/generative-ui/route.ts src/app/demos/generative-ui/page.tsx src/components/generative-ui/GenerativeUIRenderer.tsx src/data/demos.ts src/components/sections/AITools.tsx`
- `npx vitest run src/__tests__/lib/generativeUiCatalog.test.ts`
- `npm run build`
