# Findings and repair

Confirmed and repaired: IPv6 address-deny bypasses and credential forwarding
across origin-changing redirects. Runtime behavior is covered by classifier,
mocked-DNS and mocked-fetch regression tests. See the independent report at
docs/security-audit-comparison-2026-10-24.md for Gemini claim-by-claim results,
deployment unknowns, residual risks and prioritized follow-ups.
