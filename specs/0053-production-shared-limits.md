# SPEC-0053: Require shared enforcement in production

Hosted deployments must not silently fall back to process-local rate limits or
durable counters/approvals when Redis is missing. Reject those operations when
VERCEL_ENV is production or preview. Unhosted local builds and tests retain their local
fallbacks. Configured Redis failures already propagate; do not fall back on
network errors. Convert enforcement failures to safe, traced 503 responses,
without including provider errors or configuration values in responses/logs.

Scope: rate limiter, durable store, common API enforcement, focused tests.
No environment values, ingress trust policy, CSP or deployment settings change.
Actual private production configuration remains unverified. Hosted production/preview
builds without Redis may now refuse affected requests intentionally.

Verify missing configuration, Redis rejection, safe 503 responses and preserved
local behavior; run typecheck, lint, full coverage, build and npm audit.
Rollback: revert this commit. Operational prerequisite: configure shared Redis
before deploying to any environment where affected demos must remain available.

Deployment boundary: this repository is deployed on Vercel. NODE_ENV alone is
not a hosting signal: Playwright deliberately runs a production build locally
without Redis. Any future non-Vercel host must set VERCEL_ENV=production or
replace this check with its trusted deployment-environment signal.
