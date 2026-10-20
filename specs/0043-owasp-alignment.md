# SPEC-0043: OWASP alignment (MCP Top 10, Agentic Skills Top 10, ASVS)

**Status**: Implemented (pending CI)
**Date**: 2026-10-20

## What

`docs/OWASP_ALIGNMENT.md`: this repo mapped to the OWASP MCP Top 10, the OWASP Agentic Skills Top 10 and ASVS 5.0
(chapter level, Level 1 target), with evidence files and a gaps column for each row. It also holds a server and backend
inventory and a skill revocation procedure. The /governance page links to it next to the existing security-pillar
mapping.

## Why

The repo already has most of these controls (tool gateway, hash-pinned scanned skill, red-team corpus, per-route CSP)
but nothing tells a reviewer or an AI agent which OWASP risks they answer. The same exercise exposed three real gaps:
an unwatched Hugging Face Space (it broke unnoticed on 2026-10-18), no tested skill revocation steps, and no alerting
on logs.

## Decisions

- Self-assessment only; no compliance or certification claim. The doc states the maturity of each source (MCP list in
  beta, skills list incubator, ASVS stable).
- ASVS is mapped by chapter, not by requirement. A requirement-level walk is listed as a follow-up.
- No behaviour change. The remaining gaps are listed with owners-of-the-decision, not fixed here:
  the log drain and alerts touch logging and deployment configuration and need the owner's approval.
- Skill count is nine (the earlier chat estimate of ten was wrong).

## Verification

Governance page test asserts the new link; all evidence paths in the doc exist (checked by script before commit).
