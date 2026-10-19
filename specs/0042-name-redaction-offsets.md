# SPEC-0042: Name redaction works without NER offsets, and says when it cannot

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-19

## What

The edge-agent demo's browser tier now redacts person names. The NER model's result is mapped back onto the text by
the entity word, every occurrence is redacted, and the page shows a visible notice when name detection is unavailable
or a name cannot be placed.

## Why

The live check after SPEC-0041 left "Customer: Sarah Mitchell" unredacted. Running the same model
(`Xenova/bert-base-NER`, Transformers.js 4.3.1, `aggregation_strategy: 'simple'`) on the demo text showed it tags the
name correctly (PER, 0.998) but returns only `entity_group`, `word` and `score`, with no `start`/`end`. The redaction
code required `start`/`end`, so every name was skipped. A test even asserted that behaviour. The `catch {}` around the
NER pass would also have hidden a model load failure, so a failed name pass looked identical to a clean one.

## Decisions

- Locate each PER entity's `word` in the text with a whitespace-tolerant, Unicode letter/number-bounded match, so
  "Al" does not match inside "Algorithm" and "Sarah  Mitchell" (two spaces) still matches.
- Redact every occurrence of a found name, not only the first.
- `RedactionResult.nameDetection` is `ok`, `unavailable` (load or run failed; logged with `console.warn`) or
  `unlocated` (name found but not placeable). The page shows a notice in the redaction card and at the approval gate.
- Regex redactions still apply when the model fails; the server backstop is unchanged.
- No model change, no new dependencies.

## Limits (unchanged)

Names the model misses are still missed; the page already says redaction is best effort and the human reviews it at
the gate. Dates and street addresses remain out of scope (SPEC-0041).

## Verification

Unit tests for offset-free entities, repeats, double spaces, short-name boundaries, unlocated names and model failure.
After deploy: run the demo with the sample document and confirm `NAME` appears in the redacted fields.
