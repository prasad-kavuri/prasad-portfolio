# CSP Stage 4 Feasibility: 2026-10-28

## Decision

Do not remove script-src 'unsafe-inline' in production yet. Prefer a nonce-based
candidate for a separate preview-only trial. SRI alone fails the minimal
hydration experiment. Production source, policy and rendering are unchanged.

## Verified local evidence

Installed Next.js: 16.4.2; default Turbopack build. Isolated fixture includes a
React client counter and next-themes. Its CSP excludes script-src unsafe-inline
in both modes; style-src unsafe-inline is deliberately unchanged. Chromium
blocks all off-origin requests; no model calls or browser-AI weight downloads.

| Observation | SRI-only mode | Nonce mode |
| --- | --- | --- |
| Build succeeds | Yes | Yes |
| Root route rendering | Static | Dynamic |
| HTTP status | 200 | 200 |
| Client counter increments | No | Yes |
| Inline script CSP violations | 4 | 0 |
| External scripts with integrity | 5 of 7 | 0 of 7 (SRI disabled for comparison) |
| Script elements carrying nonce | 0 of 11 | 11 of 11 |
| Nonce changes on reload | Not applicable | Yes |

These are observations of this fixture/build, not universal script counts or a
full compatibility certification. SRI failure is expected diagnostic evidence,
not a failed application test. The HTTP 200 response alone concealed broken
hydration, so header/status checks cannot be the stage 4 acceptance gate.

The installed Turbopack implementation consumes experimental.sri and emits a
subresource-integrity manifest. Do not repeat older claims that this version
cannot emit SRI under Turbopack. However, asset integrity is not authorization
for inline bootstrap/Flight/theme scripts. Their violations remained when
SRI was enabled and script-src was only 'self'.

The nonce fixture passes matching CSP and x-nonce request headers through Proxy,
opts into dynamic rendering with connection(), and passes the nonce to
next-themes. Next attaches nonces to its scripts. The candidate uses
script-src 'self' 'nonce-...' 'strict-dynamic'; nonces are redacted in output.

## Rendering, caching and cost

Per-request nonces require the HTML to be generated for that request. Adding
request headers/connection() to the portfolio's shared root layout would affect
all routes inheriting it, not just a selected browser demo. Never cache nonce
HTML with a mismatched or reused response CSP. Static assets can still be
cached; this is not a reason to disable every cache or API data cache.

The fixture confirms static-to-dynamic classification, not production cost or
latency. No production p95, hosting-cost estimate or regional cache-hit change
was measured. Those require the actual preview app and hosting telemetry.
Build-time inline-script hashing is a separate untested approach, not something
this experiment proves impossible. It needs stable HTML/hash manifests, dynamic
route handling, header-size limits and navigation tests before consideration.

## Next preview trial (not implemented here)

1. Use a separate preview branch/deployment. Keep the enforced policy unchanged
   first, and observe a nonce candidate in Report-Only mode. Confirm how the
   installed renderer selects its nonce from request CSP headers; emitting only
   a response header is insufficient. Prevent caller-supplied nonce spoofing.
2. Wire the actual theme provider, framework scripts and relevant custom scripts
   to the request nonce. Keep style-src, COOP/COEP and the three WASM policy
   exceptions unchanged; do not impose the minimal fixture policy on demos.
3. Test hard loads, reloads, soft navigation in both directions across policy
   tiers, theme switching, hydration, streaming and production error pages.
   Include normal routes, APIs, analytics/Speed Insights, and all three WASM
   routes with actual model loading and inference. No paid model calls without
   explicit approval. Simulated fallback is not evidence that WASM still works.
4. Collect Chromium, Firefox and WebKit policy violations plus interactive
   assertions. Compare warm/cold TTFB and cache behavior over repeated requests;
   set acceptable hosting/performance budgets before choosing enforcement.
5. Enforce the candidate only on that preview after Report-Only evidence is
   clean. Validate fresh, unpredictable matching nonces and unchanged workflows.
   A production rollout needs a separate reviewed PR and a tested rollback.

The existing localhost-only probe cannot be pointed at production or a remote
preview. It tests the fixture, not the full portfolio. A later trial needs its
own explicitly scoped preview instrumentation; no runtime flag is added here.

## Reproduce

From the repository root, use separate terminals for build/start and probe:

```sh
CSP_FIXTURE_MODE=sri npx next build scripts/fixtures/csp-sri
CSP_FIXTURE_MODE=sri npx next start scripts/fixtures/csp-sri --hostname 127.0.0.1 --port 3100
node scripts/csp-fixture-probe.mjs http://127.0.0.1:3100
```

Stop the fixture server before rebuilding. Repeat with CSP_FIXTURE_MODE=nonce
on both build and start. Install the matching Playwright Chromium first; set
PLAYWRIGHT_BROWSERS_PATH consistently if using a custom browser cache.
Fixture build output stays in its ignored node_modules/.cache/next directory.
No portfolio config file is read or modified by this experiment.

## Dependency advisory check (no package edits)

- GHSA-gcqx-w48m-w2h4: deepmerge 4.3.1 is still the latest registry release;
  GitHub lists no patch. The reported breaking shadcn downgrade is not adopted.
  Three low-severity audit entries describe this dependency chain, not three
  independently demonstrated application exploits.
- A newer moderate advisory, GHSA-rmxm-3fg6-px4f, affects the installed
  @hono/node-server 2.0.12 through the MCP SDK, including the production tree.
  Its affected range ends before 2.1.3; registry release 2.1.5 fits the SDK's
  declared ^2.0.5 range. Test a targeted lockfile refresh in a separate PR.
  The advisory concerns serveStatic path decoding; repository source has no
  serveStatic call. Exploitability in this deployment is not established.
- No audit exceptions, forced downgrades or dependency upgrades are made here.

## Sources

- Installed guide: node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
- Installed implementation: next/dist/build/turbopack-build/impl.js and
  next/dist/shared/lib/turbopack/manifest-loader.js (sriEnabled/manifest writing)
- Installed renderer: next/dist/server/app-render/use-flight-response.js and
  get-script-nonce-from-header.js (nonce handling)
- [Official Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
- [Hono node-server advisory](https://github.com/advisories/GHSA-rmxm-3fg6-px4f)
