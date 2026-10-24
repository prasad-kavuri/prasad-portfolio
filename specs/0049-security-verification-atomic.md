# SPEC-0049: Strict deployment checks and atomic Redis operations

Date: 2026-10-24

Require essential CSP directives and bounded code sources, HSTS of at least
one year with includeSubDomains, COEP credentialless and the existing
Permissions-Policy restrictions. Preserve both shipped CSP tiers.

Consume OTP claims with GETDEL. Increment budget counters and assign missing
expiry in one Redis Lua operation without extending existing expiry. No CSP,
token-scope, quota or production configuration changes.

Verify negative header fixtures, real CSP builders and mocked atomic Redis
operations. Run coverage, typecheck, lint, build, audit and live verification.
