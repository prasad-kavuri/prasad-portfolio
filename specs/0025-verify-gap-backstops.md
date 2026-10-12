# SPEC-0025: Verify the backstops behind the documented red-team gaps

**Status**: Implemented
**Date**: 2026-10-12

## What

Four attacks stay in the red-team corpus as documented gaps (SE-01, SE-02, MT-09, MT-10): semantic
attacks a pattern guard cannot catch without blocking legitimate users. Each already named the control
that still prevents harm, but only as prose. This makes those claims tested.

1. Each known gap lists `backstops`: the corpus case ids that verify its safeguard. CI fails if a listed
   case is missing, is itself a gap, or stops passing. The page shows "Verified by …" next to each gap.
2. **BK-01** (new, data boundary): every entry of the assistant's knowledge base is scanned for
   credential-shaped text (provider keys, private keys, key/password assignments, bearer tokens, env var
   names). The detector has its own positive and negative tests.
3. A route test sends the gap conversations (padded fragments, forged assistant turn, paraphrased
   extraction) through the real assistant route and asserts the request to the model offers no
   `tools`/`functions`/`tool_choice`/`function_call` and carries no credential in its body; the key
   travels only in the Authorization header.

## Why

Closing the four gaps with more patterns would only game the score: SE-01/SE-02/MT-09 are semantic, and
a pattern wide enough to catch them also blocks ordinary recruiter questions (benign controls BN-04 and
BN-MT-03). The honest position is defense in depth with each outer-layer miss proven harmless by an
inner layer. Result: 78 cases, 59 of 63 attacks blocked, still 4 documented gaps, 0 false positives, and every gap
now points at checks that fail the build if the safeguard erodes.

## Not done (needs owner approval)

MT-10 can be closed structurally by HMAC-signing assistant replies and verifying them on the next
request. That adds a server secret (env handling) and a chat UI change, so it is deliberately left out.

## Scope boundaries

Out of scope: any change to guardrail patterns, headers/CSP, rate limits, auth, env handling, logging,
deployment config, demo registry, positioning/metadata/`llms*` files.

## Verification

`npx tsc --noEmit`, `npm run lint`, `npm run test:coverage`, `npm audit --audit-level=high`,
`npm run build`. Mutation check: adding a `tools` field to the Groq request body fails the new route
test (3 failures).
