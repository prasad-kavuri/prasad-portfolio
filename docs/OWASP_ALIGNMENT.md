# OWASP alignment: MCP Top 10, Agentic Skills Top 10 and ASVS

Last reviewed: 2026-10-20 (SPEC-0043, updated by SPEC-0044)

This is a self-assessment, not a certification and not a third-party penetration test (see
`docs/SECURITY_THREAT_MODEL.md`). It maps this repository to three OWASP projects. Every "Evidence" entry is a file or
workflow in this repository. "Gap" says plainly what is not done.

Maturity of the sources, so the claims are read at the right weight:

- [OWASP MCP Top 10](https://owasp.org/projects/mcp-top-10): beta (the project's own phase 3 of 5). Risk names are the
  2025 labels. The project page gives no per-risk mitigations, so the "what this repo does" column is this repo's own
  reading, not OWASP guidance.
- [OWASP Agentic Skills Top 10](https://owasp.org/projects/agentic-skills-top-10): incubator project, version 1.0-2026.
- [OWASP ASVS](https://owasp.org/projects/asvs): stable, version 5.0.0. It is written for web applications, so only
  part of it applies to a portfolio site.

## 1. MCP Top 10

This site runs one MCP server, `/api/mcp` (Streamable HTTP, stateless, official `@modelcontextprotocol/sdk`). It
exposes three read-only profile tools.

| Risk | What this repo does | Evidence | Gap or limit |
|---|---|---|---|
| MCP01 Token mismanagement and secret exposure | Secrets live only in Vercel environment variables; a secret scan runs on every change; tokens are signed with a server secret and the build refuses to sign in production without it; stored queries are redacted | `.gitignore`, `.github/workflows/ci.yml` (gitleaks), `src/lib/agent-auth.ts`, `src/lib/query-log.ts` | Tokens are demo tokens with short lifetimes (1 hour anonymous, 24 hours claimed); there is no revocation list |
| MCP02 Privilege escalation via scope creep | Tool policy is default deny; each tool names the scope it needs; `get_achievements` requires `read:profile` | `src/lib/tool-policy.ts`, `src/lib/tool-gateway.ts` | Scopes are a fixed table in code; no periodic review of them is scheduled |
| MCP03 Tool poisoning | Every tool result is screened for injected instructions before a model sees it; tools are first-party and read-only | `src/lib/tool-gateway.ts`, `src/lib/guardrails.ts` (`screenToolOutput`), red-team cases tagged `ASI06` | The screen is heuristic. This server does not consume third-party MCP tools, so tool poisoning of third-party servers is not exercised |
| MCP04 Supply chain and dependency tampering | A committed lockfile (most packages use caret ranges; the framework is pinned), weekly Dependabot, a dependency-audit policy with one dated exception, SHA-pinned skill text, a pinned SkillSpector commit | `package.json`, `.github/dependabot.yml`, `scripts/audit-dependencies.mjs`, `docs/DEPENDENCY_AUDIT_EXCEPTION.md`, `.github/skill-security-scope.json` | The `braces` audit exception (dev tooling) expires after 2026-12-17 UTC. Third-party GitHub Actions are tag-pinned, not SHA-pinned |
| MCP05 Command injection and execution | The MCP tools take zod-validated inputs and only read static profile data; no tool builds a shell command, file path or query from input | `src/app/api/mcp/route.ts`, `src/lib/profile-tools.ts` | Applies to the MCP server only; demos that call models are covered under the threat model |
| MCP06 Prompt injection via contextual payloads | Input, conversation and tool-output screening; a deterministic red-team corpus runs in CI | `src/lib/guardrails.ts`, `src/lib/conversation-guard.ts`, `src/lib/redteam/`, `/security/red-team` | Heuristic detection; 4 known gaps are published, each with a verified backstop |
| MCP07 Insufficient authentication and authorization | Bearer verification, protected-resource metadata advertised for clients, default-deny tool authorization, per-IP rate limits | `src/app/api/mcp/route.ts`, `src/lib/agent-auth.ts`, `src/lib/rate-limit.ts` | Anonymous access is intentional for the public tools. Token issuance is a demonstration flow, not a full OAuth server |
| MCP08 Lack of audit and telemetry | Every tool call produces a span with the principal, decision and reason; denials and invalid tokens are logged with a trace id | `src/lib/tool-gateway.ts`, `src/app/api/mcp/route.ts`, `src/lib/api.ts` | Logs are platform logs only: no log drain, no alert on denials, retries or `api.upstream_busy`, and no immutable audit trail. This is the main open gap |
| MCP09 Shadow MCP servers | One MCP server, listed here and in `/.well-known` metadata. See the inventory below | `src/app/api/mcp/route.ts`, `public/.well-known/` | Backends outside the repo (the Hugging Face Space) are only partly watched: the weekly model check covers Groq ids, not the Space |
| MCP10 Context injection and over-sharing | The server is stateless: no session, memory or shared context between callers; client IPs are hashed for rate limiting | `src/app/api/mcp/route.ts`, `src/lib/rate-limit.ts` | None known for the MCP server; the browser-edge demo is covered by its own approval gate |

### Server and backend inventory

| Component | Where it runs | In this repo | Owner | Watched by |
|---|---|---|---|---|
| Profile MCP server | Vercel, `/api/mcp` | yes | repo owner | post-deploy verification, tests |
| Groq model calls (6 routes) | Groq API via Vercel routes | yes | repo owner | weekly Model health (our three model ids) |
| Multi-agent backend | Hugging Face Space `prasadkavuri/multi-agent-demo` (FastAPI) | no (`app.py` lives in the Space) | repo owner | nothing automated; it broke unnoticed once (2026-10-18) |
| Claude plugin connector | Users' own Claude sessions, calling `/api/mcp` | yes (`plugins/prasad-profile/.mcp.json`) | repo owner | unit test pins the URL; same server checks as above |
| Rate-limit and approval state | Upstash Redis | no (managed service) | repo owner | provider |

Adding any new MCP server, Space or external backend means adding a row here in the same change.

## 2. Agentic Skills Top 10

The repo ships nine skills under `skills/` (the project skill `prasad-portfolio` plus eight workflow skills) and a
generated `skills/index.json`. All nine are scanned and hash-pinned (SPEC-0044). A tenth, `evaluate-fit`, ships inside the visitor plugin
(`plugins/prasad-profile/`, SPEC-0045) and is scanned the same way.

| Risk | What this repo does | Evidence | Gap or limit |
|---|---|---|---|
| AST01 Malicious skills | Every skill is scanned by SkillSpector (static only) on skill changes and weekly; all skills are first-party and reviewed by the owner | `.github/workflows/skill-security.yml`, `docs/SKILL_SECURITY_SCOPE.md` | Static scan only; MEDIUM findings (an `npx tsc` false positive on four skills, plus two documented ones on the project skill) stay as visible warnings |
| AST02 Supply chain compromise | Skills are served from this repo only, the scanner is pinned to a commit, and every skill's text is pinned by SHA-256 | `.github/skill-security-scope.json`, `.github/workflows/skill-security.yml` | No signing of skills; no other registry is used |
| AST03 Over-privileged skills | `self-heal` and `security-review` state which steps are free and which need a person's approval; the repo operating contract forbids reading secrets or changing security configuration without approval | `skills/self-heal/SKILL.md`, `skills/security-review/SKILL.md` (Safety tiers), `AGENTS.md`, `CLAUDE.md` | Policy text, not a technical sandbox; the other skills have no tiers section |
| AST04 Insecure metadata | Frontmatter is linted ("Use when" descriptions) and the index is generated and drift-tested | `src/__tests__/lib/skills-frontmatter.test.ts`, `scripts/generate-skill-index.mjs` | Skills do not declare permissions, so there is nothing to compare declared against actual behaviour |
| AST05 Untrusted external instructions | Skill text is pinned and reviewed; no skill is fetched at run time by this site | `.github/skill-security-scope.json` | The external links inside each skill have not been inventoried or snapshotted |
| AST06 Weak isolation | Skills run in the user's own agent, not on the site; the site never executes skills | `docs/SKILL_SECURITY_SCOPE.md` | Isolation is the agent runtime's job and is not verified here |
| AST07 Update drift | A changed byte in any skill fails the gate until its hash and reviewed lines are refreshed on purpose (a unit test also catches it before CI); Dependabot proposes updates for review | `.github/scripts/skill_security.py`, `.github/skill-security-scope.json` | Pinning is of the skill text only; nothing watches for a skill being copied elsewhere |
| AST08 Poor scanning | SkillSpector reads natural-language skill text as well as code, alongside Semgrep, gitleaks and the audit policy | `.github/workflows/skill-security.yml`, `.github/workflows/ci.yml` | The scanner's report is partial by design (reference notices are excepted at reviewed lines); no runtime behaviour monitoring |
| AST09 No governance | A generated index is the inventory; every change goes through a reviewed pull request and a numbered spec; the revocation procedure is below | `skills/index.json`, `specs/`, this file | Owner is a single person; the revocation steps have not been exercised |
| AST10 Cross-platform reuse | One canonical copy of each skill; the visitor plugin packages one skill and one connector for Claude Code, and the packaging is tested | `skills/`, `plugins/prasad-profile/`, `docs/PLUGIN.md` | Only Claude Code packaging exists; if skills are ported to another platform, record the platform and permissions per skill |

### Skill revocation procedure

If a skill is found to be unsafe or wrong:

1. Open a pull request that deletes the skill folder (or reverts the change) and regenerates the index with
   `node scripts/generate-skill-index.mjs`. For `prasad-portfolio`, also update `.github/skill-security-scope.json`.
2. Merge after all checks pass. The index and the raw GitHub entrypoints stop serving the skill once the file is gone.
3. Check `/agent-readiness` and `llms.txt` links to the skill and remove them in the same pull request.
4. Record the reason in `CHANGELOG.md`. Agents that already copied the skill keep their copy; this cannot be undone
   from the repo.

This procedure has not been run on a real incident.

## 3. ASVS 5.0 (self-assessed against Level 1)

Level 1 is the basic baseline. Level 2 is the usual target for applications that handle sensitive data. This site holds
no user accounts or stored personal data, so Level 1 is the target and the table says where chapters do not apply. This
is a chapter-level self-assessment: a requirement-by-requirement walk has not been done.

| Chapter | Applies | Where the repo stands | Evidence |
|---|---|---|---|
| V1 Encoding and sanitization | Yes | Model output is sanitised before rendering; untrusted content is not rendered as HTML | `src/lib/guardrails.ts`, `docs/SECURITY_THREAT_MODEL.md` |
| V2 Validation and business logic | Yes | Request bodies are validated per route; rate limits and cost caps protect expensive paths | `src/lib/api.ts`, `src/lib/rate-limit.ts`, `src/lib/cost-control.ts` |
| V3 Web frontend security | Yes | Per-route Content-Security-Policy, frame denial, referrer and permissions policies, all re-checked after each deploy | `src/lib/csp.ts`, `src/proxy.ts`, `scripts/verify-deploy.mjs`. Gap: `unsafe-inline` remains (SPEC-0027 stage 4 is a proposal) |
| V4 API and web service | Yes | Typed JSON routes, method handling and error shaping in one helper; MCP over the official SDK | `src/lib/api.ts`, `src/app/api/` |
| V5 File handling | Limited | No user uploads; the resume route serves a fixed file | `src/app/api/resume-download/route.ts` |
| V6 to V8 Authentication, session management, authorization | Limited | No user accounts or sessions; agent tool calls are authorised per tool | `src/lib/tool-policy.ts`, `src/lib/agent-auth.ts` |
| V9 Self-contained tokens | Partly | Demo tokens are HMAC-signed with an expiry and fail closed without the secret in production | `src/lib/agent-auth.ts`. Gap: no revocation, demo scope only |
| V10 OAuth and OIDC | Limited | Protected-resource metadata is advertised; this site is not an OAuth authorization server | `/.well-known/oauth-protected-resource` |
| V11 Cryptography | Yes (minimal) | HMAC-SHA256 through Web Crypto; no custom primitives | `src/lib/agent-auth.ts` |
| V12 Secure communication | Yes | HTTPS only with HSTS (2 years, preload) | `src/proxy.ts`, `next.config.ts` |
| V13 Configuration | Yes | Secrets only in environment variables, secret scan in CI, dependency audit policy, pinned versions | `.github/workflows/ci.yml`, `scripts/audit-dependencies.mjs` |
| V14 Data protection | Yes | Query logs are redacted and truncated; client IPs are hashed; the edge demo redacts in the browser | `src/lib/query-log.ts`, `src/lib/rate-limit.ts`, `src/lib/edge-inference.ts` |
| V15 Secure coding and architecture | Yes | Server-only LLM calls, strict TypeScript, tests with coverage gates, static analysis | `docs/adr/0001-server-only-llm-calls.md`, `.github/workflows/ci.yml` |
| V16 Security logging and error handling | Partly | Structured events with trace ids; errors return shaped responses | `src/lib/api.ts`. Gap: no central log store or alerting (same gap as MCP08) |
| V17 WebRTC | No | The site does not use WebRTC | none |

## What would close the remaining gaps

1. A log drain with alert rules for denied tool calls, invalid tokens, `api.upstream_busy` and `api.model_fallback`
   (closes MCP08 and the V16 gap). It touches logging and deployment configuration, so it needs the owner's approval.
2. A health check for the Hugging Face Space and a UI smoke test of the multi-agent flow (MCP09).
3. A requirement-by-requirement ASVS Level 1 walk, then a review date each quarter.
4. SHA-pinned third-party GitHub Actions (MCP04).
5. An external review, if the site is to claim more than a self-assessment.
