# Independent Security Review and Gemini Comparison

Date: 2026-10-24. Repository: prasad-kavuri/prasad-portfolio.

## Summary

The supplied Gemini report is useful as a list of topics, but its dated evidence
does not justify implementing its recommendations directly. Its filename says
October 24, while its body and timestamp say May 15, 2026. It cites obsolete
versions, titles, navigation, and demo counts. No original audit prompt is
included in the attached document, so its exact wording and tool constraints
cannot be independently assessed. The declared scope says read-only.

Independent source review found two concrete outbound-request issues not
identified by Gemini. Both are fixed in this change with offline regression
tests. Remaining concerns are documented below with their limits.

## Method and Boundaries

- Read the supplied report and current source for CSP, proxy limits, route
  budgets, durable storage, URL validation, fetch redirects, logging, agent tool
  authorization, and selected API input paths.
- Read the live homepage headers, WASM route headers, and llms.txt using ordinary
  public requests. No production abuse, internal-network probing, or paid model
  requests were performed.
- Reproduced address-classification failures locally with mocked DNS/fetch.
- Run regression, coverage, compiler, lint, build and dependency checks; final
  results are recorded in the PR. Existing CI provides additional scanning.
- Did not read environment files, credentials, private deployment configuration,
  historical private logs, or third-party agent implementation details. This
  review does not claim a new exhaustive Semgrep/gitleaks scan or penetration test.

## Agreement and Disagreement

| Gemini claim/recommendation | Independent assessment | Action |
| --- | --- | --- |
| Improve identity consistency across crawler artifacts | Agree with the principle; report does not show a concrete current mismatch. Live llms.txt correctly identifies Head of AI Platform & Agentic Solutions at Zip. | Validate actual mismatches before changing profile content. |
| Optimize for VP/Head job-search targets | Stale framing for a currently employed platform leader. Adding target roles is not a security fix and conflicts with the owner-approved positioning. | No change. |
| Thirteen demos are source/live aligned | Unsupported for current source: the registry currently has 14 entries. The report also cites an architecture data file that is not evidence reviewed here. | Do not treat the reconciliation table as current verification. |
| Primary navigation lacks For Recruiters | Already addressed by SPEC-0026; current Navbar includes it and a Platform menu with Capabilities. | No duplicate navigation change. |
| Add HTTP discovery Link headers | Live homepage already sends llms.txt and agent-context Link relations. An additional describedby relation is optional, not an established security requirement. | No speculative header change. |
| JSON-LD binds credentials directly to Google's Knowledge Graph | Overstatement. Publishing schema does not establish indexing, knowledge-graph admission, or ranking. | Avoid guarantees. |
| Guardrails prevent injection, PII leakage, and hallucination | Disagree with guarantee. Regex checks reduce covered cases; they cannot prove the absence of these failures. The red-team corpus and runtime authorization are stronger evidence within their own bounded scope. | Document residual risk; preserve deterministic tool permissions. |
| Skill modules run inside isolated non-root sandboxes | Not established by the repository. A skill is instructions executed by its host; host isolation is external configuration. | Do not advertise as verified. |
| Add middleware and daily spend controls | Partly stale: proxy and route limits plus daily route/client call caps already exist. Per-session token/dollar budgets are different and are not demonstrated by those call caps. | Clarify enforcement and deployment assumptions. |
| Define CSP in next.config.ts | Wrong for current architecture. CSP is built in src/lib/csp.ts and sent only by src/proxy.ts, with strict/full tiers. Duplicating it risks conflicting policies. | Keep current ownership. |
| Whitelist model CDNs | Already implemented, including a pinned ONNX package path and Hugging Face CDN destinations on the full tier. | Preserve tests and post-deploy verification. |
| COEP is require-corp | Live COEP is credentialless; COOP is same-origin. | Correct the report. |
| Next ^16.0 / React ^19.0 / TypeScript ^5.0 | Stale: reviewed manifest uses exact Next 16.4.2 and TypeScript 6.0.3; inspect lockfile for installed dependencies. | Use current manifest evidence. |
| Self-host models to guarantee 100% availability | Disagree. Self-hosting moves availability and bandwidth responsibility; it provides no absolute guarantee. | Evaluate measurements, model licensing, cache cost, and deployment limits first. |
| Improve hydration/Core Web Vitals | Plausible optimization, but no current measurements were supplied. FID is not the current responsiveness Core Web Vital (INP replaced it). | Measure before changing recruiter pages. |
| Put summary within 250 tokens to eliminate truncation risk | No universal cutoff exists across crawlers/models. Short summaries help, but cannot eliminate truncation. | Keep canonical concise/full representations consistent. |

## Confirmed Findings and Fixes

### F1: IPv6 representations bypassed the address deny checks

Priority: High. Verified at the classifier and mocked safe-fetch boundary, not
as a demonstrated production network compromise.

The old code compared textual prefixes. Expanded loopback/unspecified addresses,
hexadecimal IPv4-mapped private addresses, and most of fe80::/10 and fec0::/10
were not recognized. Examples include ::ffff:7f00:1 and febf::1. DNS responses
and canonicalized URL hosts can use these forms.

Fourteen regression cases failed before the fix. The updated implementation
canonicalizes validated IPv6 literals with the standard URL parser, applies
the existing IPv4 policy to mapped IPv4 addresses, covers the full local
prefix ranges, and rejects multicast/scoped forms. Tests cover URL hosts,
initial DNS answers, redirect DNS answers, and permitted public addresses.
Blocked targets never reach the mocked fetch.

Files: src/lib/url-security.ts; src/__tests__/lib/url-security.test.ts;
src/__tests__/lib/safe-fetch.test.ts. See SPEC-0048.

### F2: Manual redirects retained credentials across origins

Priority: High if a credentialed upstream redirects to another origin. No
hostile redirect or actual credential disclosure was observed in production.

safeServerFetch reused RequestInit headers for manually followed redirects.
The model router supplies its provider Authorization header to this helper.
A cross-origin redirect could therefore forward that credential, unlike the
normal expectation for credential handling at an origin boundary.

The helper now rejects origin-changing redirects if Authorization, Cookie,
or Proxy-Authorization headers are present. It still permits same-origin
authenticated redirects and uncredentialed public redirects. Tests cover
each credential header and both allowed cases without contacting providers.

Files: src/lib/safe-fetch.ts and its tests. See SPEC-0048.

## Additional Findings and Follow-Ups

### F3: Distributed abuse controls depend on deployment configuration

Priority: Medium; deployment confirmation needed. Route rate limiting uses
Upstash when configured. Otherwise it falls back to process memory. Daily
budgets have the same storage dependency. Proxy buckets are process-local.
These maps are not a shared fleet-wide quota across serverless instances.
No private configuration was read, so this review cannot assert that live
Redis is absent or that production limits are bypassable.

Existing daily defaults are 500 admitted requests per route per UTC day and
60 per client across routes. These count admitted route requests, not every
provider call, token, or dollar; fallback, retries, compaction, and tool loops
can amplify provider usage within a request. Routes do impose model token
limits, but that is not equivalent to a global monetary ceiling.

Next: verify production Redis wiring and trusted ingress IP normalization;
set provider-side spending controls where supported; evaluate atomic token or
cost reservation if a hard shared spend guarantee is required. Any session
identifier used for limits must not be freely resettable by the caller.

### F4: DNS validation is separate from the connection lookup

Priority: Medium to High depending on permitted outbound destinations.
safeServerFetch checks DNS, then fetch performs its own connection resolution.
The fix to F1 does not remove the potential DNS-rebinding timing gap. Connection
pinning or an egress proxy/allowlist is a separate networking change. Prefer
fixed approved destinations for provider calls. Third-party agent services
receiving user URLs also require independent outbound validation; checking a
URL here cannot prove how the remote service later resolves it.

### F5: JSON parsing precedes application field-size validation

Priority: Medium, defense in depth. readJsonObject calls req.json before field
length checks; evaluation-showcase also parses directly and does not cap
mockResponse length. Hosting limits may bound request size, but this review
did not verify a deployment-specific cap. A shared byte limit should be
designed against legitimate multi-turn history sizes and enforced while
reading, not solely by trusting Content-Length. This is not a demonstrated
unbounded production upload or memory exhaustion exploit.

### F6: Heuristic redaction and privacy statements need qualification

Priority: Medium. query-log redacts known patterns and truncates text, but
cannot guarantee it removes every personal detail. Public eval-snapshot
returns aggregate counts and scores, not raw stored query snippets in the
inspected route. Do not conflate that route with an observed transcript leak.
Threat-model residual-risk labels and older claims about tool enforcement
should be reviewed against the current gateway and explicit limitations.

### F7: CSP still intentionally permits inline scripts

Priority: Medium, already staged in SPEC-0027. The strict tier drops eval and
model CDN access but retains unsafe-inline for framework bootstrap. This is
a known limitation, not an absent CSP. Removing it requires a separate,
tested stage compatible with caching and browser demos. No CSP change belongs
in this classifier/redirect repair.

## Live Observations on 2026-10-24

Homepage returned HTTPS 200 with HSTS (63072000; includeSubDomains; preload),
nosniff, DENY framing, strict-origin-when-cross-origin referrer policy, restrictive
Permissions-Policy, COOP same-origin, and COEP credentialless. Its strict CSP
has no unsafe-eval or model CDN connect sources, but retains unsafe-inline.
The RAG demo gets the full CSP with the pinned ONNX path and model CDNs.
These are HTTP/header observations; no certificate-chain/cipher inventory,
browser execution audit, or full route crawl was conducted.

## Recommended Order

1. Merge the regression-tested F1/F2 repairs after required CI checks pass.
2. Confirm Redis/provider budgets and ingress identity assumptions (F3).
3. Design connection-bound DNS/egress enforcement and bounded body reading
   as separate changes with explicit compatibility tests (F4/F5).
4. Refresh privacy/threat-model wording and continue staged CSP work (F6/F7).
5. Treat recruiter UX and crawler optimizations as measured product work,
   not security vulnerabilities inferred from this stale report.

## Primary References

- OWASP SSRF Prevention Cheat Sheet:
  https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP LLM01 Prompt Injection:
  https://genai.owasp.org/llmrisk/llm01-prompt-injection/
- Web Vitals (current metrics): https://web.dev/articles/vitals
- Repository controls: src/lib/csp.ts, src/proxy.ts, src/lib/api.ts,
  src/lib/durable-store.ts, src/lib/rate-limit.ts, src/lib/query-log.ts,
  src/lib/tool-policy.ts and src/lib/tool-gateway.ts.
