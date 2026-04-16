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

## Security Posture Summary

Current controls implemented in this repo include:
- centralized guardrails (`src/lib/guardrails.ts`) for prompt safety and output sanitization,
- outbound URL hardening (`src/lib/url-security.ts`) and safe server-side fetch behavior (`src/lib/safe-fetch.ts`),
- route-level validation, rate limiting, traceable logging, and standardized error handling (`src/lib/api.ts`, `src/lib/rate-limit.ts`, `src/lib/observability.ts`),
- dependency scanning (`npm audit --audit-level=high`) and automated update hygiene via Dependabot (`.github/dependabot.yml`),
- environment-variable-based secret handling (no hardcoded API keys in source).

## Safe Harbor

Good-faith security research and responsible disclosure are appreciated. Please avoid privacy violations, service disruption, or destructive testing.
