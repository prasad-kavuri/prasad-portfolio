# Security Threat Model

Last reviewed: 2026-04-26

This document summarizes the documented security posture for the prasadkavuri.com portfolio. It is a lightweight engineering threat model, not a claim of third-party penetration testing or formal certification.

## Scope

Scope includes the public Next.js portfolio application, serverless API routes, browser AI demos, public machine-readable metadata, coding-agent documentation, and repo-hosted governance surfaces.

Out of scope: third-party model providers, browser extension behavior, local developer machines, private Vercel project settings, and external agent runtimes outside the repository contract.

## Assets Protected

- API keys, Vercel secrets, tokens, and environment variables.
- User-submitted prompts, URLs, resumes, and job descriptions.
- Runtime query snippets and evaluation logs.
- Public portfolio content, metadata, and structured data integrity.
- API spend, model routing, and rate-limit budgets.
- Governance, trust, and machine-readable agent surfaces.

## Trust Boundaries

- Browser client to Next.js serverless API routes.
- Next.js API routes to Groq, Hugging Face, Upstash Redis, and Vercel services.
- User-provided URLs to server-side fetch utilities.
- LLM output to React rendering surfaces.
- Coding agents to repo-scoped source files and documentation.
- Public `.well-known` metadata to crawlers, recruiters, and AI agents.

## Primary Attack Classes

| Threat | Likelihood | Impact | Control | Residual Risk |
|--------|-----------|--------|---------|---------------|
| Prompt injection | Medium | Medium | guardrails.ts regex sanitization | Low — heuristic only |
| Tool misuse by agents | Low | Medium | AGENTS.md + CLAUDE.md policy contract | Low — policy, not runtime |
| SSRF | Low | High | DNS lookup + private IP block + redirect recheck | Very Low |
| XSS / unsafe rendering | Low | Medium | CSP strict allowlist, no HTML render of untrusted content | Very Low |
| Denial of Wallet | Medium | High | Proxy rate limit 60 req/min/IP + route-level limits | Low |
| Secrets leakage | Low | High | .env gitignored, PII redaction in query-log.ts | Very Low |
| PII in logs | Low | Medium | query-log.ts redaction (email, phone, bearer, API keys) | Very Low |
| Supply chain | Low | High | npm audit --audit-level=high in CI + lockfile | Low |

## Current Controls

- CSP is configured in both `next.config.ts` and `src/proxy.ts`, with allowlisted script/connect origins for the deployed browser AI and analytics requirements.
- COOP/COEP headers support browser WASM/WebGPU isolation where required.
- Proxy-level API rate limiting and route-level rate limiting provide layered abuse and denial-of-wallet controls.
- `src/lib/safe-fetch.ts` and `src/lib/url-security.ts` validate URLs, resolve DNS where Node APIs are available, block private/internal IPs, and re-check redirect targets.
- `src/lib/guardrails.ts` provides prompt-injection heuristics, input/output validation helpers, and regex-based output filtering.
- `src/lib/query-log.ts` redacts emails, phone numbers, bearer tokens, API-key-like strings, and environment-style assignments before snippets are stored.
- Environment hygiene relies on `.gitignore` secret exclusions and environment-variable-based secret loading.
- CI includes audit, lint, coverage, build, and E2E checks.
- The Agent Sandbox Contract is documented in `AGENTS.md`, `CLAUDE.md`, `SECURITY.md`, and the repo skill.

## Residual Risks

- Third-party agent runtimes may vary in how they enforce repository policies.
- Browser model and CDN availability can affect browser-side AI demos.
- No formal third-party penetration test has been completed for this portfolio.
- Heuristic prompt-injection detection reduces common attacks but is not a complete guarantee.
- DNS validation depends on runtime support for Node DNS APIs and deployment infrastructure behavior.

## Validation Checklist

- [ ] `npm audit --audit-level=high`
- [ ] `npm run lint`
- [ ] `npm run test:coverage`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] Security-specific tests for CSP, rate limiting, SSRF blocking, query-log redaction, and machine-readable posture.
