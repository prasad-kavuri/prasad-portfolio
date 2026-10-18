# SPEC-0036: Stop the handoff guard from rejecting normal prose

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-18

## What

The multi-agent demo's handoff context check no longer treats a semicolon as a code pattern. Every other blocked
character and pattern stays.

## Why

After the Hugging Face Space moved to `gpt-oss-120b`, the live demo failed on nearly every run. The backend returned 200
with good output, but the page joins the Analyzer's findings into a handoff summary and `validateHandoffContext`
rejected it ("context summary contains blocked code-like patterns"). The new model writes ordinary English with
semicolons ("Content is sparse; key achievements..."). On 2026-10-18 all three live Analyzer outputs (681 to 765
characters, under the 1000 limit) contained one, as did two of three Researcher outputs. A semicolon in prose is not
an injection vector.

## Decisions

- Remove `;` from the blocked character class only. Still blocked: `{ } [ ] < > ` $`, `../`, import/require/eval/process
  patterns, system paths, prompt-injection phrases and the 1000-character limit.
- Do not touch `validateRefinementInstruction`, which guards user-typed input and keeps its stricter set.
- Do not rely on a "no semicolons" instruction in the model prompt; model output style drifts.

## Scope boundaries

- In scope: `src/lib/guardrails.ts` (one character), `src/__tests__/agents/guardrails-handoff.test.ts`.
- Out of scope: the Space, other guardrail checks, model changes.

## Human approval

Guardrail change; approved by the repository owner in chat on 2026-10-18.

## Verification

`npx vitest run src/__tests__/agents`, `npx tsc --noEmit`, `npx eslint`, then run the live demo after deploy.
