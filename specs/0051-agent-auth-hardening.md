# SPEC-0051: Restrict development signing and validate token claims

Date: 2026-10-24

## What and why

The public fallback signing secret must never be used by production or preview
deployments. Permit it only with NODE_ENV development/test and VERCEL_ENV
absent or development. Configured nonblank secrets retain their exact bytes.

Verify signed payload shape before consuming it: bounded nonblank subject and
scopes, known token type, optional bounded email, and nonnegative safe integer
timestamps with exp greater than iat. Reject future issuance and now >= exp.
Bound token length and require the issued base64url/HMAC wire format before
cryptographic processing. No new identity-verification or email-ownership claim.

## Scope

Auth helper and regression tests only. No scope grants, OTP flow, secrets,
deployment settings or CSP changes. Existing valid issued tokens still work.
Previews without a configured secret intentionally stop issuing credentials.

## Verification

Test environment combinations, configured secrets, independently HMAC-signed
malformed payloads, expiration boundaries, valid anonymous/claimed tokens,
MCP/A2A and auth-route integration. Run full coverage, lint, typecheck, build
and dependency audit. Roll back by reverting this commit if integration fails.
