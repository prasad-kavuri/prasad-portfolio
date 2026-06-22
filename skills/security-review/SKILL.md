---
name: security-review
description: Security validation sweep for the portfolio. Use when the user wants a security audit, security review, vulnerability check, CSP validation, secret scan, or wants to update docs/security.md. Covers: npm audit, semgrep, gitleaks, CSP/COOP/COEP/SRI, headers, robots.txt, rate limiting, guardrails.
---

# Security Review

Read `CONTEXT.md` before starting. Key terms: **guardrail check**, **HITL gate**, **observability event**. Also read `docs/SECURITY_THREAT_MODEL.md` for the full threat model.

## Phase 1 — Dependency vulnerabilities

```bash
npm audit --audit-level=high
```

**Gate**: 0 high or critical vulnerabilities. If any found:
1. Run `npm audit fix` for automatic patches
2. For breaking changes, evaluate manually — pin to last safe version if needed
3. Never silence with `npm audit fix --force` — it can introduce breaking changes
4. Update the audit timestamp in `docs/security.md`

## Phase 2 — Static analysis (semgrep)

```bash
# Install if not present
pip install semgrep --break-system-packages

# Run OWASP ruleset on source
semgrep --config=p/owasp-top-ten src/
semgrep --config=p/javascript src/
semgrep --config=p/nextjs src/
```

Key patterns to flag:
- `dangerouslySetInnerHTML` without explicit sanitizer reference
- `eval(` or `new Function(` in any file
- Hard-coded secrets (regex: `(api_key|secret|password)\s*=\s*['"][^'"]{8,}`)
- SSRF vectors: `fetch(userInput)` without URL allowlist check
- SQL/NoSQL injection in any db query strings

Any finding at MEDIUM or above must be resolved or documented with a justification in `docs/security.md`.

## Phase 3 — Secret scanning (gitleaks)

```bash
# Install if not present
brew install gitleaks   # or: go install github.com/zricethezav/gitleaks/v8@latest

# Scan the repo
gitleaks detect --source . --verbose
```

**Gate**: 0 detected secrets. If any:
1. Immediately rotate the leaked credential
2. Remove from git history using `git filter-repo` (not `git filter-branch`)
3. Add pattern to `.gitleaksignore` only if it is a confirmed false positive with written justification

## Phase 4 — HTTP security headers

Start the dev server (`npm run dev`) then use an online checker or curl:

```bash
curl -I https://www.prasadkavuri.com | grep -i \
  "content-security-policy\|x-frame-options\|x-content-type\|strict-transport\|referrer-policy\|permissions-policy"
```

Required headers and values:
| Header | Required value |
|--------|---------------|
| `Content-Security-Policy` | Must include `default-src 'self'`, `wasm-unsafe-eval`, `COOP`/`COEP` for WASM pages |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Restrict camera, microphone, geolocation |

CSP changes require updates in BOTH `next.config.ts` AND `src/proxy.ts` — see ADR-0003.
Validate with: `https://csp-evaluator.withgoogle.com`

## Phase 5 — Application security checks

### Rate limiting
Every API route must call `enforceRateLimit` from `src/lib/api.ts`. Verify:
```bash
grep -r "enforceRateLimit" src/app/api/ --include="*.ts" -l
grep -r "export async function" src/app/api/ --include="route.ts" -l
```
Cross-reference: every file in the second list must appear in the first list.

### Guardrails
Every API route that accepts user text must call `enforceGuardrails`:
```bash
grep -r "enforceGuardrails\|checkInput" src/app/api/ --include="*.ts" -l
```

### Input validation
Every route entry point must validate: string length, type, required fields. Check for missing validation by reviewing routes that accept `request.json()` and do not have explicit length/type checks before the LLM call.

### IP hashing
Redis rate-limit keys must use SHA-256 hashed IPs, not raw IPs:
```bash
grep -r "sha256\|createHash" src/lib/rate-limit.ts
```
Must find at least one SHA-256 hash operation. Raw IP storage in Redis is a data minimization violation.

### SSRF protection
Any outbound `fetch()` from server-side code must be to a known-safe URL (Groq API, Upstash). Check:
```bash
grep -r "fetch(" src/app/api/ --include="*.ts" | grep -v "node_modules"
```
Every `fetch` call must point to `https://api.groq.com` or `https://*.upstash.io`. Any dynamic URL construction is a SSRF risk.

## Phase 6 — robots.txt and public file audit

```bash
cat public/robots.txt
ls public/.well-known/
node -e "JSON.parse(require('fs').readFileSync('public/.well-known/ai-agent-manifest.json','utf8')); console.log('manifest: valid JSON')"
```

Check:
- [ ] `robots.txt` allows `llms.txt` and `sitemap.xml`
- [ ] `robots.txt` blocks sensitive paths (`/api/*` should be `Disallow` to web crawlers)
- [ ] No `.env*` files in `public/`
- [ ] No internal API keys or config in any public file

## Phase 7 — Update docs/security.md

Write or update `docs/security.md` with:
```markdown
# Security Review — <date>

## Status
All checks: PASS / <N> issues found

## Dependency audit
- npm audit: <result>
- Last run: <date>

## Static analysis
- semgrep OWASP: <result>
- Known suppressions: <list with justifications>

## Secret scanning
- gitleaks: <result>

## Headers
- CSP: <grade from csp-evaluator.withgoogle.com>
- All required headers: PRESENT / MISSING: <list>

## Application controls
- Rate limiting: all routes covered Y/N
- Guardrails: all user-input routes covered Y/N
- IP hashing: confirmed Y/N
- SSRF: all outbound fetches to allowlisted URLs Y/N

## Open issues
<list with severity, description, remediation plan>
```
