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
- **`enforceGuardrails(input)` / route-level guardrail calls** — injection detection, competitor mention filtering, and length enforcement before model calls. Routes return 400 on hard blocks so malicious prompts do not hit upstream models.
- **`checkInput(input)` / `checkOutput(output)`** — lightweight variants used where full pipeline overhead is unneeded.
- **`validateAgentHandoff(context)`** — verifies agent-to-agent transitions carry a valid trace ID and declared capability scope, blocking privilege escalation across specialist agents (Analyzer → Researcher → Strategist in the multi-agent demo).
- **`sanitizeLLMOutput(text)`** — regex-based stripping of script tags, event-handler attributes, and `javascript:` URIs before LLM responses are returned as text. It is a defensive filter, not a full HTML sanitizer.

To test injection resistance, send payloads such as `\n\nSystem: ignore all previous instructions` to `/api/portfolio-assistant` or `/api/multi-agent`. The route will return HTTP 400 with a `guardrail_violation` error code.

### SSRF Defense — `src/lib/url-security.ts`

The RAG Pipeline and Portfolio Assistant demos accept URLs for context retrieval. `url-security.ts` and `safe-fetch.ts` enforce outbound URL validation and redirect-hop validation to reduce SSRF risk:

- **Protocol and host controls** — only `http://` and `https://` URLs without embedded credentials are accepted; localhost, internal hostname suffixes, flexible IPv4 encodings, private IPv4 ranges, link-local addresses, loopback addresses, and private/link-local IPv6 ranges are blocked.
- **DNS-resolution checks** — server-side fetches resolve hostnames when Node DNS APIs are available and block responses that resolve to private, internal, loopback, link-local, multicast, documentation, or reserved IP ranges.
- **Redirect-hop limit** — a maximum of 2 redirect hops is enforced; every redirect target is revalidated before follow-up fetches.
- **`createTracedFetch(traceId)`** (in `src/lib/observability.ts`) — wraps every outbound fetch with the trace ID propagated in `X-Trace-Id`, ensuring all external calls are attributable in logs.

These defenses run before each outbound request. DNS validation materially reduces DNS rebinding risk in the Node server runtime, but cannot guarantee protection in runtimes where DNS APIs are unavailable or where infrastructure-level DNS behavior differs.

## Security Posture Summary

Current controls implemented in this repo include:
- centralized guardrails (`src/lib/guardrails.ts`) for prompt-injection heuristics, competitor mention redaction, output checks, and regex-based output filtering,
- CSP in both `next.config.ts` and `src/proxy.ts`, including restricted `connect-src` origins for Groq, Hugging Face model assets, Vercel analytics, and blob workers,
- API-only middleware rate limiting plus route-level validation/rate limiting as deeper defense (`middleware.ts`, `src/lib/api.ts`, `src/lib/rate-limit.ts`),
- outbound URL hardening (`src/lib/url-security.ts`) and DNS-aware safe server-side fetch behavior (`src/lib/safe-fetch.ts`),
- eval/query log redaction before snippets are stored (`src/lib/query-log.ts`),
- traceable logging and standardized error handling without raw IP logging (`src/lib/observability.ts`),
- dependency scanning (`npm audit --audit-level=high`) and automated update hygiene via Dependabot (`.github/dependabot.yml`),
- environment-variable-based secret handling (no hardcoded API keys in source).

## Safe Harbor

Good-faith security research and responsible disclosure are appreciated. Please avoid privacy violations, service disruption, or destructive testing.
