# SPEC-0028: Post-deploy verification of production

**Status**: Implemented
**Date**: 2026-10-14

## What

A script, `scripts/verify-deploy.mjs`, and a workflow, `.github/workflows/post-deploy-verify.yml`, that check the
live site after each production deploy. The workflow runs on a successful Vercel production `deployment_status`, on a
manual dispatch, and on a daily schedule (to catch drift without a deploy).

## Checks

- Every route in a fixed list returns 200 with the expected CSP tier. `Server-Timing: csp;desc="strict|full"` must
  match the tier, and the `Content-Security-Policy` header must agree with it:
  - strict pages (`/`, `/about`, `/for-recruiters`, `/governance`): no `unsafe-eval`, no `wasm-unsafe-eval`, no `blob:`,
    no CDN script origin.
  - full pages (the three WASM demos): `wasm-unsafe-eval` present, the pinned onnxruntime-web CDN path present, and
    no whole-origin `cdn.jsdelivr.net` or `unpkg.com` (SPEC-0027 stage 3). Bumping `ORT_WEB_VERSION` means bumping the
    constant in the script too; a test fails until both match.
- `/api/*` responses carry a CSP but no `Server-Timing: csp` (the proxy skips it there).
- Baseline headers on every route: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy: same-origin`.
- The homepage header links to `/for-recruiters`, and the key link targets answer 200.

## Why

SPEC-0027 splits the CSP by route. A routing or proxy mistake would ship the wrong tier silently, and the unit tests
cannot see what Vercel's edge actually sends. The check also settles the open question of whether the live header
shows "For Recruiters".

## Verification

`scripts/__tests__/verify-deploy.test.mjs` covers the pure checks with fake headers and HTML, and guards that the
script's strict and full route lists match `FULL_CSP_ROUTES` in `src/lib/csp.ts`. Run it against production with
`node scripts/verify-deploy.mjs --base https://www.prasadkavuri.com`.

Not covered: that the demos load models (needs a real browser and the model host), and that the response comes from the
commit that was just deployed. A failure on a stale edge cache is retried three times, 20 seconds apart.
