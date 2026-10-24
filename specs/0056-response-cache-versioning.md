# SPEC-0056: Content-aware assistant response cache keys

The assistant currently keys responses only by question and RAG flag, allowing
outdated profile/prompt/model answers to survive until the 24-hour expiry.

Hash a structured tuple containing key schema version, question, RAG flag,
full profile snapshot, effective system prompt, ordered model fallback chain,
and explicit response-contract version. Use pa-cache:v2: as namespace. No raw
profile, prompt or question appears in the resulting key. Old keys become
unreachable without deleting unrelated data; Redis expires them naturally.

Profile, prompt and model-chain changes automatically invalidate the cache.
Bump the route's response-contract version when generation settings, output
processing or replay semantics change without a prompt/model/profile change.
The chain represents the allowed model policy, not the actual fallback used
for a particular response. Single-turn-only eligibility, SSE replay, storage
failure handling, local capacity and existing 24-hour TTL remain unchanged.

Scope: cache helper, assistant integration, regression tests, this spec.
No security settings, positioning, profile data or deployment configuration.
Verify deterministic keys, each invalidation dimension, no plaintext in keys,
old-key misses, cache isolation, TTL/capacity and route wiring/multi-turn bypass.
Run typecheck, lint, full coverage, build, npm audit and API browser regressions.
Rollback: revert the commit; no cache migration is required.
