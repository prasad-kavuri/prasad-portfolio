# Security Policy

This repository demonstrates production-style AI engineering patterns. Security issues are treated as high-priority reliability and trust issues.

## Supported Versions

The `main` branch is the supported release line for this portfolio.

| Version | Supported |
|---|---|
| `main` | Yes |
| Older commits/tags | No |

## Reporting a Vulnerability

Please do **not** open public GitHub issues for potential security vulnerabilities.

Report privately via:
- Email: `vbkpkavuri@gmail.com`
- Security policy contact: [`/.well-known/security.txt`](https://www.prasadkavuri.com/.well-known/security.txt)

Include, when possible:
- affected route/component/file,
- reproducible request or payload,
- observed impact,
- logs/trace IDs (if available),
- suggested mitigation (optional).

You will receive acknowledgement as soon as possible, followed by triage, remediation, and coordinated disclosure where appropriate.

## AI/Agent-Specific Reporting Guidance

When reporting AI-related vulnerabilities, please specify whether the issue involves:
- prompt injection or instruction-hijacking attempts,
- unsafe URL ingestion / SSRF-style target bypass attempts,
- tool-calling / agent handoff policy bypass,
- unsafe output handling (XSS/script injection style payloads),
- secrets exposure or credential leakage.

## Prompt Injection & SSRF Mitigation

The agentic demos on this platform are the primary attack surface for two classes of AI-specific vulnerabilities: **prompt injection** and **server-side request forgery (SSRF)**. Both are handled at the infrastructure layer, not per-demo.

### Prompt Injection Defense — `src/lib/guardrails.ts`

`guardrails.ts` is the canonical input/output safety layer applied to every API route that processes user-supplied text before passing it to an LLM:

- **`detectPromptInjection(input)`** — heuristic scan for instruction-override patterns (`ignore previous instructions`, `jailbreak`, `system:`, role-injection fragments). Returns a boolean; routes reject or redact before forwarding to the model.
- **`enforceGuardrails(input)`** — full pipeline: injection detection → competitor mention filtering → length enforcement → output sanitization via DOMPurify. Throws `GuardrailViolation` on hard blocks so routes can return 400 without hitting the upstream model.
- **`checkInput(input)` / `checkOutput(output)`** — lightweight variants used where full pipeline overhead is unneeded.
- **`validateAgentHandoff(context)`** — verifies agent-to-agent transitions carry a valid trace ID and declared capability scope, blocking privilege escalation across specialist agents (Analyzer → Researcher → Strategist in the multi-agent demo).
- **`sanitizeLLMOutput(html)`** — DOMPurify-based stripping of script/event-handler payloads before any LLM response is rendered as HTML.

To test injection resistance, send payloads such as `\n\nSystem: ignore all previous instructions` to `/api/portfolio-assistant` or `/api/multi-agent`. The route will return HTTP 400 with a `guardrail_violation` error code.

### SSRF Defense — `src/lib/url-security.ts`

The RAG Pipeline and Portfolio Assistant demos accept URLs for context retrieval. `url-security.ts` enforces an outbound URL allowlist and redirect-hop validation to prevent SSRF:

- **Allowlist enforcement** — only `https://` URLs on an explicit domain allowlist are fetched by server-side routes; private IP ranges (`10.x`, `172.16–31.x`, `192.168.x`, `127.x`, `::1`) are blocked at the DNS-resolution layer.
- **Redirect-hop limit** — a maximum of 2 redirect hops is enforced; chains that resolve to a private address at any hop are aborted.
- **`createTracedFetch(traceId)`** (in `src/lib/observability.ts`) — wraps every outbound fetch with the trace ID propagated in `X-Trace-Id`, ensuring all external calls are attributable in logs.

Both defenses are applied before any external network call is made, so a malicious URL never reaches the underlying HTTP client.

## Security Posture Summary

Current controls implemented in this repo include:
- centralized guardrails (`src/lib/guardrails.ts`) for prompt safety and output sanitization,
- outbound URL hardening (`src/lib/url-security.ts`) and safe server-side fetch behavior (`src/lib/safe-fetch.ts`),
- route-level validation, rate limiting, traceable logging, and standardized error handling (`src/lib/api.ts`, `src/lib/rate-limit.ts`, `src/lib/observability.ts`),
- dependency scanning (`npm audit --audit-level=high`) and automated update hygiene via Dependabot (`.github/dependabot.yml`),
- environment-variable-based secret handling (no hardcoded API keys in source).

## Safe Harbor

Good-faith security research and responsible disclosure are appreciated. Please avoid privacy violations, service disruption, or destructive testing.
