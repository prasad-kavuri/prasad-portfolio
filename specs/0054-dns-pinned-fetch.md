# SPEC-0054: Pin outbound connections to validated DNS results

The safe fetch helper currently validates DNS before native fetch performs its
own lookup. Eliminate that validation/connection race with a per-hop Undici
Agent whose connection lookup returns only the validated address set, allowing
Node's dual-stack connection selection without a second DNS resolution.
Validate all DNS answers first; reject empty or malformed results. Preserve
the original URL/hostname so Host, SNI and certificate verification remain
unchanged. No IP URL rewriting, global dispatcher changes or TLS bypasses.

Each redirect is independently validated and pinned. Cancel discarded redirect
bodies. Close each hop's agent gracefully after headers (without waiting for
the returned body to be consumed); closing waits for outstanding response work.
Disable Next fetch caching for these security-sensitive outbound requests.
Next's installed patch-fetch implementation forwards dispatcher for URL inputs.

The standalone assertSafeFetchTarget is only preflight validation, not a pinned
connection guarantee. It cannot protect a separate service that later fetches a
supplied URL (including the external multi-agent Space); that service needs its
own connection-time controls. This change only secures safeServerFetch itself.

Scope: helper, unit regressions, direct Undici dependency and lockfile.
Verify DNS rebinding, mixed/empty answers, redirects, Host preservation and agent
cleanup, then typecheck, lint, full coverage, build and dependency audit.
Rollback by reverting this commit. Preview smoke-test both caller demos before
merging because this changes their server-side transport configuration.

References:
- https://nodejs.org/api/globals.html#custom-dispatcher
- https://github.com/nodejs/undici/blob/main/docs/docs/api/Client.md
- https://github.com/nodejs/undici/blob/main/docs/docs/api/Dispatcher.md
