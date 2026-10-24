# SPEC-0055: Bound verification requests and validate security.txt expiry

The standalone deployment verifier must not wait indefinitely for headers or
body content, and must reject stale vulnerability disclosure metadata.

Give each request a 10-second deadline spanning fetch and required body reads.
Abort on timeout and report the affected URL path. Clear timers after success
or failure; cancel unused response bodies. Keep manual redirects and existing
three-attempt retry behavior. Do not change the five-minute workflow cap.

Require exactly one case-insensitive Expires field, a calendar-valid RFC3339
timestamp with seconds and a timezone, and a strictly future expiration.
Accept UTC, fractional seconds and numeric offsets. The timestamp checker is
not a full security.txt conformance validator (e.g. leap seconds unsupported).
Use built-in Date parsing with format/calendar checks: this script runs without
npm install in post-deploy CI. No new dependency or workflow change.

Tests: stalled headers/body, abort, timer cleanup, unused body cancellation,
CLI retry/exhaustion, malformed/duplicate/expired/exact-boundary timestamps,
valid offset/leap-year dates and healthy end-to-end verification.
Run typecheck, lint, full coverage, build, npm audit and live verification.
Scope: script, tests, this spec. Rollback: revert this commit.

Reference: https://www.rfc-editor.org/rfc/rfc9116.html#section-2.5.5
