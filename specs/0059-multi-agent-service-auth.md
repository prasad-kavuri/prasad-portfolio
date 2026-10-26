# SPEC-0059: Authenticate and bound the external Multi-Agent service

Reviewed Space revision: 1f17a35e17808f4363bd75124da26c522867fdfe.
It does not fetch websites: it sends URL text to three Groq calls. Its public
analyze handler bypasses the portfolio's limits when called directly.

Require a matching MULTI_AGENT_SHARED_SECRET (32-256 printable ASCII characters,
no whitespace)
in Vercel and the Space. Send it only as a server-side Bearer header; reject
missing configuration with 503 and invalid credentials with 401 before reading
the body or calling models. No fallback credential and no secret in logs/URLs.

Ship a deployable services/multi-agent-space package: 1 KiB streamed body cap,
5-second body deadline, validated HTTP(S) URL <=200 characters, no credentials,
no extra fields, two active analyses maximum, 20 admissions per minute and
100 per UTC day per process (failed/cancelled work still counts). These local
limits reset on restart and are not distributed spend guarantees. Portfolio
Redis budgets remain authoritative; configure a provider-side hard cap too.

Use async provider calls, 12-second SDK timeout, zero retries and a 45-second
overall deadline. Validate bounded findings, recommendation and confidence;
never return provider exception details. Preserve response fields used by the
portfolio and explicitly mark URL-only suggestions, not fetched-site evidence.
Update the stale current-role sentence from the canonical owner-supplied role.
Do not add a website scraper or loosen existing portfolio security checks.

Scope: caller, caller tests, deployment package/tests/README, test-only CI workflow
and spec. No existing
secrets read or changed. Space publishing is unavailable through the connected
read-only tools: stage tested sources in this PR, with manual external rollout.
Do not claim remote deployment or full remediation until both sides are live.

Verification: offline Python unittest + dependency audit; portfolio typecheck,
lint, coverage, build, npm audit and API browser tests. Deploy the Space package
and configure secrets in an agreed maintenance window, then merge the caller
after a preview succeeds. Old caller lacks auth and will fail after Space
hardening until redeployed. Never roll back to an unauthenticated Space to
restore availability; disable the demo or retain auth and fix forward instead.
