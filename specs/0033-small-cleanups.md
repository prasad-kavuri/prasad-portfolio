# SPEC-0033: Small cleanups after the model migration

**Status**: Implemented (pending CI and live verification)
**Date**: 2026-10-18

## What

Four small items left over from SPEC-0029 to SPEC-0032, plus one finding made while doing them:

1. The multi-agent demo is broken on production (502 "Failed to connect to agent backend"). Its backend is a
   Hugging Face Space (`prasadkavuri/multi-agent-demo`, last updated 2026-04-09) whose `app.py` calls
   `llama-3.3-70b-versatile` on Groq, a model Groq retired. This repo only proxies it, so the fix is a three-line change
   in the Space (below), not in this repo. Earlier I wrongly thought this route did not use Groq.
2. Labels that still name retired models are updated: multi-agent tag and keywords, the architecture card, the
   simulated KV-cache dashboard model names, and the stale row in the pinned project skill.
3. The security-pillar mapping doc is linked from `/governance` next to the threat model.
4. A weekly workflow checks that each model in `src/lib/groq-models.ts` is still listed and still answers.

## Why

Retired models break demos silently; the multi-agent failure went unnoticed until now. Labels that name models the site
no longer uses read as careless to a technical reviewer, and the new mapping doc is only useful if people can find it.

## Decisions

- The retired-model drift test no longer exempts the simulated dashboard data, now that it is clean.

- Space patch (done outside this repo, by the owner): in `app.py`, change `model="llama-3.3-70b-versatile"` to
  `model="openai/gpt-oss-120b"`, raise `max_tokens` from 500 to 1500, and add
  `extra_body={"reasoning_effort": "low", "include_reasoning": False}`. `extra_body` is used because the Space pins
  `groq==0.11.0`, which predates those named arguments. `response_format` stays; JSON mode with this model works on
  production (generative UI).
- The multi-agent labels say GPT-OSS 120B, so merge this PR only after the Space is patched and the demo works.
- `skills/prasad-portfolio/SKILL.md` has one table row changed in place (the retired "Resume Generator" row becomes
  "Storm Research", a live Groq demo), so the line count and the 32 reviewed line numbers hold. The pinned SHA-256 in
  `.github/skill-security-scope.json` is refreshed deliberately; the SkillSpector run on the PR must still be read.
- Historical release notes (`docs/releases/`) keep their original model names.
- `scripts/check-models.mjs` lists models, then sends each a one-line prompt (a rate limit counts as inconclusive, not a
  failure). The key is read from the `GROQ_API_KEY` repository secret and is never printed. Without the secret the job
  warns and passes. This adds a CI workflow, which the owner approved.

## Scope boundaries

- In scope: labels above, governance link, `scripts/check-models.mjs` and its test, `.github/workflows/model-health.yml`,
  the Space patch instructions.
- Out of scope: pinning or upgrading the Space's dependencies, adding error handling to the Space, any other copy of
  retired model names in `docs/releases/`.

## Open questions / [NEEDS CLARIFICATION]

- The Space's failure was inferred from its source and the 502, not read from its logs. Verify by running the demo after
  patching.
- The owner must add `GROQ_API_KEY` as a GitHub repository secret for the model-health workflow to do anything.

## Verification

- `npx vitest run scripts src/__tests__/components/GovernancePage.test.tsx`, `python3 .github/scripts/skill_security_test.py`
- `npx tsc --noEmit`, `npx eslint src scripts`, `npx vitest run`, `npm run build`, `node scripts/audit-dependencies.mjs`
- After the Space is patched: POST `/api/multi-agent` on production returns 200 with three agents.

Rollback: revert the commit; restore the Space's previous `app.py`.
