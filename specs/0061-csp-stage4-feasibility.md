# SPEC-0061: Isolated CSP stage 4 feasibility experiment

Do not alter production CSP, rendering or configuration. Use the installed Next
version in a separate fixture under scripts/fixtures/csp-sri to compare SRI-only
static rendering with per-request nonce/dynamic rendering. The fixture includes
a client counter and next-themes to detect blocked hydration/bootstrap scripts.
Mode is explicitly chosen only for fixture build/start using CSP_FIXTURE_MODE.

A localhost-only Playwright probe captures inline policy violations, external
script integrity coverage, nonce rotation and counter interactivity. It does
not call models, download browser-AI weights or modify production responses.
Add unit checks for the probe target restriction. Document actual observations,
limitations and the next preview trial in a findings report. No claim of full
portfolio compatibility or production performance follows from this fixture.

Verify both fixture builds/probes, typecheck, lint, full coverage, root production
build and relevant browser tests. Audit dependency patch availability without
changing packages or adding exceptions. Rollback: revert experiment/docs only.
