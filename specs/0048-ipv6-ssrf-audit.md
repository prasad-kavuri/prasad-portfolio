# SPEC-0048: Normalize IPv6 before outbound address classification

## Problem

The October 24 independent audit found that IPv6 string-prefix checks miss
expanded loopback/unspecified addresses, hexadecimal IPv4-mapped private
addresses, and most of the link-local/site-local prefix ranges. DNS answers
and WHATWG-normalized URL hosts can use these spellings.

## Change

Normalize validated IPv6 literals with the standard URL parser before
classification. Translate IPv4-mapped hexadecimal suffixes to IPv4 and apply
the existing IPv4 deny rules. Cover the complete fe80::/10 and fec0::/10
ranges, zone identifiers, and multicast. Keep public address behavior.

Also reject cross-origin redirects carrying authorization, cookie, or proxy
authorization headers. The model router uses this helper with its provider
credential; a redirect must not forward that credential to another origin.
Same-origin authenticated and uncredentialed public redirects remain allowed.

## Verification

Regression tests for equivalent encodings, both prefix boundaries, public
IPv6/mapped addresses, and safeServerFetch initial DNS and redirect checks.
Verify blocked destinations never reach fetch. Run full coverage, lint,
typecheck, build, and audit. No production probing of internal destinations.

## Limits

This repairs address classification. It does not pin DNS resolution to the
connection socket or inspect third-party agent runtimes. Record these and
the Gemini report comparison in docs/security-audit-comparison-2026-10-24.md.
