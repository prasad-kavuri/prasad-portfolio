# SPEC-0027: Harden the Content Security Policy in stages

**Status**: In Progress. Stages 1 to 3 implemented 2026-10-12; stage 4 is a proposal.
**Date**: 2026-10-12

## What

Replace the single site-wide policy with a narrower one, in four stages that each ship alone and can be
rolled back alone. Today every route gets the same policy: `script-src` allows `'unsafe-inline'`,
`'unsafe-eval'`, `blob:`, `cdn.jsdelivr.net` and `unpkg.com`.

## Why

- The public Governance page says the permissive directives exist "solely to support the browser-native AI
  demos" and that "all other routes operate under a strict baseline policy". Neither is true today: the same
  policy is sent on every route (`next.config.ts` `/(.*)` and `src/proxy.ts`), and `unsafe-inline` is there for
  Next.js inline bootstrap scripts, not for the demos.
- Only three pages run WebAssembly models in the browser: `/demos/rag-pipeline`, `/demos/quantization` and
  `/demos/edge-agent-collaboration`. The other pages need no `unsafe-eval`, `blob:` or CDN script origins.
- Next.js 16's own guide says `unsafe-eval` is needed in development only, not in production.
- The policy is copied by hand into two files. The repo already treats drift between them as a risk.

## Stages

1. **One source of truth (no behaviour change). Done.** Build the policy string in one module used by both
   `next.config.ts` and `src/proxy.ts`. A test asserts both emit byte-identical policies, replacing the
   regex checks in `security-headers.test.ts`.
2. **Per-route policy. Done.** Pages outside the three demo routes drop `unsafe-eval`, `blob:`, the two CDN script
   origins, the Hugging Face and CDN `connect-src` entries and `worker-src blob:`. The demo routes keep
   today's policy. COOP and COEP stay as they are. The proxy chooses the policy by path, and the
   `next.config.ts` header is removed so a route is never given two different policies.
   Fix the Governance page wording in the same change so it matches what ships.
3. **Pin the CDN fallback. Done (narrowed, not self-hosted).** The quantization demo falls back to `cdn.jsdelivr.net` and `unpkg.com` for
   `onnxruntime-web`. Narrow those entries to the exact package path and version, or self-host the files and
   remove both origins.
4. **Remove `unsafe-inline` from `script-src` (the hard part).** Two routes, to be chosen by a trial:
   - Nonces: strong, but the guide says every page must then render dynamically. That ends static
     generation and CDN caching for the whole site, and Partial Prerendering is incompatible with it.
   - Experimental SRI hashes (`experimental.sri`): keeps static pages, but the guide marks it experimental,
     and whether Next's inline bootstrap scripts pass under `script-src 'self'` must be shown by a trial,
     not assumed.
   Run the candidate first as `Content-Security-Policy-Report-Only`, next to the enforced policy, then
   enforce only when a full crawl shows zero violations.

`style-src 'unsafe-inline'` is out of scope: the risk is low and removing it is a large change.

## Scope boundaries

- In scope: the policy string, its two delivery points, per-route selection, the Governance wording, tests.
- Out of scope: COOP and COEP, HSTS, other headers, `vercel.json`, any change to demo behaviour.

## Acceptance checks (each stage)

- `security-headers.test.ts` and a new test cover the policy for a demo route, a non-demo route and an API route.
- Local `next build` and `next start`: load every demo in a real browser; the console shows no CSP violation
  and the three WASM demos still load their models and run. Stage 2 is not done until this is observed.
- After deploy, compare `curl -I` output on `/`, `/demos/quantization` and `/api/context` with what the
  stage promised.
- Rollback for any stage is one revert; stages do not depend on later ones.

## Evidence to reuse

`src/proxy.ts`, `next.config.ts`, `src/__tests__/integration/security-headers.test.ts`,
`src/app/governance/page.tsx` (CSP note), `src/lib/transformers-loader.ts`,
`src/app/demos/quantization/page.tsx` (CDN fallback list), the Next.js CSP guide shipped with the pinned version
(`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`).

## Open questions / [NEEDS CLARIFICATION]

- Approval: repo rules forbid touching the CSP unless it is the explicit task. Approve stage 1 and 2 as the
  first implementation, or the whole spec?
- Is `/demos/portfolio-assistant` expected to use WebAssembly? Nothing in the source says so; it is treated as
  non-demo here.
- Are there other pages that load the demo components, so the route list above is incomplete? Stage 2 must
  confirm this with a full crawl before enforcing.
- Stage 4 route (nonce or SRI) is decided by the trial, not now.

## Stage 1 result

`src/lib/csp.ts` builds the policy once; `next.config.ts` and `src/proxy.ts` both import it.
`src/__tests__/lib/csp.test.ts` holds a snapshot of the pre-refactor policy as directive sets and checks that
the shared string equals it, and that each delivery point sends that exact string. Directive and source order
changed (the two old copies differed in order and in a trailing semicolon); a browser treats the policies as
equal. A production build served locally returned one policy header on `/`, `/demos/quantization`,
`/api/context` and `/for-recruiters`, each equal as directive sets to the old policy.
Not done: loading the demos in a real browser, which is not needed for a policy that did not change.

## Stage 2 result

`src/proxy.ts` now sends the full policy only on `FULL_CSP_ROUTES` (`/demos/rag-pipeline`,
`/demos/quantization`, `/demos/edge-agent-collaboration`) and a strict policy elsewhere: no `unsafe-eval`,
`wasm-unsafe-eval`, `blob:` scripts or workers, `cdn.jsdelivr.net`, `unpkg.com`, or model-host `connect-src`.
`unsafe-inline` stays until stage 4. `next.config.ts` no longer sets a CSP, so a route never gets two policies.
Server-side calls to Groq are not governed by the browser and were never needed in `connect-src` for pages.

**A catch the spec did not anticipate.** A page's policy is fixed when its document loads. Reaching a demo
through an in-app (`next/link`) click keeps the strict policy of the page the visitor came from, so the model
runtime would be blocked. The proxy now adds `Server-Timing: csp;desc="full|strict"` to page responses, and the
three demo pages render `RequireFullCsp`, which reloads once when its document was served the strict policy
(guarded against loops). Tested in a browser by clicking from `/demos` into each demo.

**Verification (production build, real Chromium):**

- Crawled all 39 routes from the sitemap plus a 404 and an unlisted route: 0 `securitypolicyviolation` events.
- A page-script instrument recorded no `eval`, `Function`, string timers, `WebAssembly.*` or `Worker` use on any
  route at load, so nothing on a strict page depends on the removed directives.
- Negative control: a script from `cdn.jsdelivr.net` on a strict page was blocked and reported.
- Raw Chrome with the two real header strings: strict blocks `eval` and WebAssembly; full allows both.
- In-app navigation from `/demos` into each of the three demos reloaded once and ended on the full policy.
- Tests: exact route matching, both policies per path through the proxy, strict never grants more than full,
  a drift test that every page importing the model runtime is on the full list, and the reload guard.

**Not verified:** loading and running the actual models in the demos. The test environment could not reach the
model host, so the demos were checked up to page load and the reload guard, not inference. The demo pages keep
the same policy as before, so this should be unchanged, but run each demo once on the Vercel preview. Playwright
does not enforce `eval` blocking, so that check used raw Chrome and the instrument above.

## Stage 3 result

Self-hosting was rejected: the runtime's WebAssembly files are 14 to 28 MB each in several variants, which would
bloat the repo and need manual refreshes. Instead the CSP allows one location,
`https://cdn.jsdelivr.net/npm/onnxruntime-web@<installed version>/dist/`, in `script-src` and `connect-src` of the
full policy. `unpkg.com` and the rest of `cdn.jsdelivr.net` are gone. Hugging Face Transformers 4.3.0 builds exactly
that address from its pinned `onnxruntime-web`, so the RAG and Edge Agent demos need no code change. The Quantization
demo's two unversioned fallback URLs (which resolve to the stable release, binary-incompatible with the installed
dev build) are replaced by the single pinned address.

`ORT_WEB_VERSION` in `src/lib/csp.ts` is the one place the version lives. Tests fail when the installed
`onnxruntime-web` version changes, when Transformers.js stops pinning that version or builds a different address,
or when the Quantization page strays from the pinned constant. The dependency audit script is unchanged.

Verified in Chromium against the served full policy: the pinned path (script and fetch) raised no CSP violation;
the unversioned path, another package on the same CDN, another version of the package, and unpkg were all blocked.
Not verified: loading the runtime and running a model, because this sandbox cannot reach the CDN or the model host.
Run each of the three demos once on the Vercel preview before merging.
