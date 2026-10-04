# Temporary dependency audit exception

Approved by the repository owner on 2026-10-03. Expires after 2026-10-17 UTC.

Only GHSA-vfj7-8cjw-p6xm is excepted. It affects braces <=3.0.3;
the advisory and npm registry report no patched release at this time.
It is present through development tooling: Next.js ESLint and shadcn.
The input at risk is deeply nested glob patterns; repository lint paths are
controlled by maintainers. This is a temporary risk acceptance, not a patch.

Both CI audit jobs use scripts/audit-dependencies.mjs. It recursively allows
only findings caused entirely by this exact advisory, blocks unrelated high
or critical findings, fails on unavailable/malformed audit results, and
automatically blocks the advisory after expiry. Regression tests cover these
boundaries. The ordinary npm audit command still reports the accepted risk.

Remove the exception when upstream publishes a patch and update the lockfile.
Do not renew it automatically or downgrade eslint-config-next/shadcn to hide it.
