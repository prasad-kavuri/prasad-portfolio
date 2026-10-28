# SPEC-0060: Documentation, discovery freshness and home-link cleanup

Reconcile ADR-0009 with shipped CSP: no script nonces/hashes, unsafe-inline in
both tiers, three WASM routes use the full tier, and the proxy alone sends CSP.
Correct its AGENTS.md summary and mark ADR-0003's dual-CSP text as historical.
Stage 4 remains a separate trial; runtime policy is unchanged.

Refresh current llms.txt, llms-full.txt and manifest freshness fields to
2026-10-28 after review against repository facts. Preserve historical retirement
dates. These indicate document review, not certification of private settings.

Label the certifications icon-only home link without altering layout. Add
rendered-link and freshness/documentation regressions. No headers, #210 rollout,
service secrets, executive positioning or profile facts change.

Verify typecheck, lint, full coverage, build, npm audit and browser regressions.
Rollback by reverting this commit; no migrations needed.
