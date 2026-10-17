# SPEC-0029: Move off retired Groq models and survive the next retirement

**Status**: Implemented (pending live verification after deploy)
**Date**: 2026-10-17

## What

Every server demo that calls Groq (homepage assistant, edge-agent, MCP demo, generative UI, storm-research, the LLM
router, the cost-control fallback and the flag-gated spatial refinement) uses a model Groq has deprecated. The model
names become one shared list, the server retries with the next model when Groq reports a model as retired or not
available to the account, and the router shows the models that exist today.

## Why

On 2026-10-17 the edge-agent demo and the homepage assistant failed with a new API key and a fresh deploy. Groq's
deprecations page lists `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` with a shutdown date of 2026-08-16 and
`qwen/qwen3-32b` and `meta-llama/llama-4-scout-17b-16e-instruct` with 2026-07-17. Its models page now shows the two
Llama models as "Contact Sales", so they may also be plan-gated. Groq's own pages disagree with each other about
whether they are still served, and the exact failure was never read from a log. The fix works either way: stop
depending on them. The owner asked for the whole model set to be reviewed, because models keep being retired.

## Decisions

- Models (Groq list, 2026-10-17): `openai/gpt-oss-20b` ($0.075 / $0.30 per 1M tokens) replaces the 8B;
  `openai/gpt-oss-120b` ($0.15 / $0.60) replaces the 70B, as Groq itself recommends; `qwen/qwen3.8-27b`
  ($0.80 / $4.00, **preview**) replaces `qwen/qwen3-32b` as the coding model. Llama 4 Scout has no listed
  replacement with a public price, so the router shows three models instead of four.
- One module, `src/lib/groq-models.ts`, holds ids, display names, prices, the tier each id belongs to and the fallback
  chain. A route names a tier, not a model string.
- Fallback: on HTTP 400, 403 or 404 whose error code says the model is decommissioned, not found or not permitted, try
  the next id in the chain. Any other error is returned as before. The chain for a preview model ends on a production
  model.
- The gpt-oss models are reasoning models. Requests send `reasoning_effort: "low"` and `include_reasoning: false`, and
  the output limit gets headroom, because reasoning tokens count against it and a small limit returns empty answers.
- Cost control: the "expensive model" rule keyed on the text "70b" now keys on the capable tier.

## Scope boundaries

- In scope: the routes above, `cost-control.ts`, `llm-routing.ts`, the router page and its estimates, tests, ADR-0005
  and the architecture note.
- Out of scope: the browser models (all-MiniLM-L6-v2, DistilBERT SST-2, bert-base-NER) are open files, not an API,
  and nothing retires them; the local Qwen MoE card (needs the owner's own server); the simulated enterprise
  dashboard labels. A scheduled model-health check needs a GitHub secret and is a follow-up.

## Evidence to reuse

`src/lib/api.ts` (`jsonError`, logging), `src/lib/cost-control.ts`, the existing route tests.

## Open questions / [NEEDS CLARIFICATION]

- The failing request was never read from a log. Run the model-list command in the PR description once to confirm the
  retired ids are gone from the account, or read `upstreamStatus` in the logs after deploy.
- gpt-oss behaviour (JSON mode, tool calling, streaming) is taken from Groq's docs and the SDK types, not exercised
  from here. Each route must be called once on the deployed site.

## Verification

- `npx tsc --noEmit`, `npx eslint src scripts`, `npx vitest run`, `npm run build`, `node scripts/audit-dependencies.mjs`
- After deploy: call the homepage assistant, edge-agent (approve and send), MCP demo, generative UI, storm-research and
  the LLM router once each and read the status.

Rollback: revert the commit; model names return to the previous literals.
