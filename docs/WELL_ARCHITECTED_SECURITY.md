# Google Cloud Well-Architected security pillar, mapped to this repo

Last reviewed: 2026-10-18 (SPEC-0031)

This is a self-assessment against the eight principles in Google's open-source
[`google-cloud-waf-security` skill](https://raw.githubusercontent.com/google/skills/main/skills/cloud/google-cloud-waf-security/SKILL.md).
It is not a certification and not a third-party penetration test (see `docs/SECURITY_THREAT_MODEL.md`). The site runs on
Vercel, Groq and Upstash rather than Google Cloud, so the principles are applied and the Google Cloud product names are
not. Every "Evidence" entry is a file or workflow in this repository.

| Principle | What this repo does | Evidence | Gap or limit |
|---|---|---|---|
| Security by design | LLM calls happen only on the server; a per-route Content-Security-Policy is built in one place and checked after every deploy; inputs are validated before any model call; server-side fetches are blocked from private addresses | `docs/adr/0001-server-only-llm-calls.md`, `src/lib/csp.ts`, `src/proxy.ts`, `src/lib/safe-fetch.ts`, `src/lib/url-security.ts`, `.github/workflows/post-deploy-verify.yml` | The full CSP on the three WASM demos needs `unsafe-eval` and `blob:` (SPEC-0027 documents why) |
| Zero trust ("never trust, always verify") | Every agent tool call goes through one gateway that denies by default and checks the caller's scopes; credentials are scoped (for example `read:profile`); client IPs are hashed before they are used as rate-limit keys | `src/lib/tool-gateway.ts`, `src/lib/tool-policy.ts`, `src/lib/agent-auth.ts`, `src/lib/rate-limit.ts` | Public demo routes are anonymous by design and rely on rate limits and guardrails |
| Shift-left security | Secret scan, static analysis, a dependency-audit policy and coverage gates run before merge; a separate scan covers the agent skill; dependency updates are automated | `.github/workflows/ci.yml` (gitleaks, semgrep, lint, tests), `scripts/audit-dependencies.mjs`, `.github/workflows/skill-security.yml`, `.github/dependabot.yml` | One time-boxed audit exception (`braces`, expires 2026-12-17) is documented in `docs/DEPENDENCY_AUDIT_EXCEPTION.md` |
| Preemptive cyber defense | An adversarial test corpus tagged to OWASP LLM 2025 and Agentic 2026 runs in CI; output drift and request anomalies are tracked; the live site is re-verified after each deploy | `src/lib/redteam/`, `src/lib/drift-monitor.ts`, `src/lib/observability.ts`, `scripts/verify-deploy.mjs` | No external threat-intelligence feed and no scheduled third-party testing |
| Secure and responsible AI | Prompt-injection detection on input, sanitising of model output, competitor and hallucination heuristics, a human-approval step before data leaves the edge, cost limits, and a model fallback when a model is retired or rate-limited | `src/lib/guardrails.ts`, `src/lib/hitl.ts`, `src/lib/cost-control.ts`, `src/lib/groq-models.ts`, `src/app/api/edge-agent/route.ts` | Heuristic checks reduce risk; they do not prove a model cannot be manipulated |
| AI for security | Not used for defence. Models are only used by the demos and by coding agents working under the repo's operating contract | `AGENTS.md`, `CLAUDE.md` (Security Scope) | Not attempted |
| Regulatory, compliance and privacy | The edge-agent demo redacts personal data in the browser and sends only what a person approves, with a receipt tied to a hash of the payload | `src/lib/edge-inference.ts`, `src/app/api/edge-agent/route.ts`, `docs/SECURITY_THREAT_MODEL.md` | No formal compliance programme or audit; the site makes no certification claim |
| Shared responsibility | Third-party providers (Vercel, Groq, Upstash, Hugging Face) are named as trust boundaries and kept out of the repo's scope; keys live only in Vercel environment variables | `docs/SECURITY_THREAT_MODEL.md` (Trust Boundaries), `.gitignore` secret exclusions | Provider-side controls are the providers' responsibility and are not verified here |

## Google Cloud items with no direct equivalent here

The Google skill's checklist names products such as VPC Service Controls perimeters, Shared VPC, Binary Authorization,
Cloud KMS and Security Command Center. This site has no private network, container images or key-management service to
apply them to, so those items are not applicable rather than passed. The closest controls are the ones above: the
per-route CSP and tool gateway for network and identity boundaries, the CI scans for supply-chain checks, and Vercel's
environment variables for secrets. If this workload ever moved to Google Cloud (for example Cloud Run with Model Armor
in front of the agents), the multi-agent security skill in the same repository would be the place to start.

## What would close the remaining gaps

1. A scheduled, documented review of this table (the date above is the last one).
2. A log drain or alerting rule for the `api.upstream_busy` and `api.model_fallback` warnings, so retirements and rate
   limits are noticed without reading logs by hand.
3. An external review or penetration test, if the site is to claim more than a self-assessment.
