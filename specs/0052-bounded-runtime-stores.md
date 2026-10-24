# SPEC-0052: Bound local traffic-control and anomaly stores

Date: 2026-10-24

## Problem and scope

Local rate-limit and cost-control maps retain inactive identities indefinitely.
Anomaly maps retain identities and all timestamps within a busy window.
Bound each map at 1,000 identities and each anomaly history at its detection
threshold (12 requests / 3 failures). Redis behavior is unchanged.

## Behavior

At capacity, local enforcement reclaims expired windows, then rejects new
identities if still full. Never evict an active enforcement window: identity
churn must not reset another client's limit. Existing identities still work.
Expired windows reset at their exact boundary. Anomaly tracking is advisory:
evict its oldest identity at capacity and retain only the newest timestamps
needed for detection. This is a per-process bound, not distributed protection.

## Verification and rollback

Regression tests fill each map, exercise identity churn, preserve active
limits, reclaim expiry, and verify anomaly thresholds after heavy traffic.
Run typecheck, lint, full coverage, production build and dependency audit.
No CSP, provider budget, identity or deployment changes. Revert the commit
to roll back.
