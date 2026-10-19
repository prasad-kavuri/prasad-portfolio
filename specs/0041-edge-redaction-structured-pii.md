# SPEC-0041: Browser redaction covers what the server blocks

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-18

## What

The edge-agent demo's browser tier now redacts the same structured PII the server tier blocks: email, phone, SSN,
credit-card (Luhn-checked) and long account numbers, plus the existing `ACC-` ids. Names still come from the BERT NER
model. The page says exactly what is and is not redacted.

## Why

SPEC-0039's trial found the browser tier redacted only names, emails and `ACC-` ids, while the server's backstop
(`detectStructuredPII`) also blocks phone, SSN, card and 9-17 digit numbers. A document containing a phone number was
passed through by the browser and then rejected by the server with a 422, which is the backstop working but a poor demo
of a privacy pipeline, and the browser tier claimed more than it delivered.

## Decisions

- One source of truth: a new `findStructuredPIISpans` in `src/lib/guardrails.ts` uses the same pattern table as
  `detectStructuredPII`; the browser calls it. Overlaps resolve to the more specific type (card over account number).
- Dates are deliberately not redacted: in this demo's documents they are business signals (timelines), and a date of
  birth cannot be told apart from a deadline by pattern. Street addresses are not detected either. The page copy states
  both limits.
- No model change (SPEC-0039): the larger PII model returned fragmented spans.
- The server check is unchanged; the new test proves the browser output passes it.

## Scope boundaries

- In scope: `src/lib/guardrails.ts` (new export), `src/lib/edge-inference.ts`, edge-agent page copy, tests.
- Out of scope: address and free-text date detection; changing the server backstop; the NER model.

## Human approval

Touches `src/lib/guardrails.ts` (a guardrails file), but only adds an export and does not loosen any check;
approved by the repository owner in chat on 2026-10-18 ("You can do spec 40").

## Verification

`npx vitest run src/__tests__/api/edge-agent-collaboration.test.ts src/__tests__/lib`, full vitest, `tsc --noEmit`,
eslint; after deploy, run the edge-agent demo with a phone number in the document and confirm it redacts and stages.
