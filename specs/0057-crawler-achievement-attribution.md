# SPEC-0057: Correct crawler-facing achievement attribution

The hidden homepage AgentContext incorrectly assigns 70% infrastructure cost
reduction and 13,000+ customers to Krutrim, and implies the portfolio's FinOps
router achieved those career metrics. profile.json attributes both to Ola.

Separate the demonstration capabilities from a factual Ola achievement sentence.
Keep all other summary content, accessibility markup and profile data unchanged.
Add a rendered-component regression checking the attribution against the Ola
experience entry and rejecting the old company/demo-achievement wording.

Scope: AgentContext, its component test, this spec. No metadata, profile,
security or navigation changes. Verify focused tests, typecheck, lint, full
coverage, production build, npm audit and API browser checks.
Rollback: revert this commit. No data or deployment migration required.
