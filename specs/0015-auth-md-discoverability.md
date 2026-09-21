# SPEC-0015: auth.md discoverability + Discover→Authenticate→Authorize→Act framing

**Status**: Implemented
**Date**: 2026-09-17

## What

User shared two related pieces (workos.com/auth-md, and two alternate headline framings — "Beyond MCP:
AI Agents Now Need a Standard for Identity, Delegation and Credentials" and "The Web Is Becoming
Agent-Native: Discover → Authenticate → Authorize → Act") and asked how they relate to the portfolio.
Assessment: the portfolio already has a working, spec-compliant implementation of the real `auth.md`
open protocol (`/demos/agent-auth`, a live `/auth.md` file, a `/.well-known/oauth-protected-resource`
endpoint) — not a hypothetical demo of a similar idea. The gap was discoverability: `/auth.md` and the
OAuth metadata endpoint were referenced only from the human-facing demo page, not from any of the
machine-readable surfaces (`llms.txt`, `entity.json`, `ai-agent-manifest.json`, `sitemap.ts`) that an
agent would actually use to find them. User approved adding both discoverability and an explicit
lifecycle framing.

Changes:
- `public/llms.txt`: added `auth.md` and `oauth-protected-resource` to the `MACHINE-READABLE` section,
  plus a one-line explicit statement of the Discover → Authenticate → Authorize → Act lifecycle mapped
  to this site's own files/endpoints.
- `public/entity.json`: added `auth_md`/`oauth_protected_resource` to `canonical_urls`; added a new
  `agent_lifecycle` object (discover/authenticate/authorize/act); added "Agent identity and auth
  (auth.md protocol)" to `key_capabilities`.
- `public/.well-known/ai-agent-manifest.json`: same pattern — added to `core_capabilities`, a new
  `agent_lifecycle` object, and `auth_md`/`oauth_protected_resource` to `links`.
- `src/app/sitemap.ts`: added `/auth.md` (priority 0.8, matching other machine-readable resources) and
  `/.well-known/oauth-protected-resource` (priority 0.7). Confirmed `/.well-known/` is not covered by
  `robots.txt`'s `/api/` disallow, so — unlike `/api/context` (SPEC-0014) — these are safe to submit.
- `src/app/demos/agent-auth/page.tsx`: added one sentence in the "Why this matters" panel explicitly
  naming the Discover → Authenticate → Authorize → Act lifecycle and mapping each stage to a concrete
  file/endpoint on this site (llms.txt/entity.json/JSON-LD → auth.md → scoped credentials → the
  `/api/mcp-demo` call already demonstrated on the page).

## Why

This is a genuine differentiator worth surfacing: most "AI-friendly portfolio" claims are unverifiable
prose. This one already has a real, spec-compliant implementation of an open protocol with real
external adopters (Cloudflare, Neon, Firecrawl, Resend, Monday.com per workos.com/auth-md), and citing
the real GitHub spec correctly. The only gap was that the discovery layer itself (the files agents
actually read first) didn't point to it.

## Scope boundaries

- In scope: adding references/links to the existing `/auth.md` and oauth-protected-resource endpoint
  across the machine-readable files, plus one explanatory sentence on the existing demo page.
- Out of scope: building anything new — `/auth.md`, the demo, and the OAuth endpoint already existed
  and were not modified in behavior, only referenced more widely.

## Verification

- `python3 -c "import json; json.load(open('public/entity.json')); json.load(open('public/.well-known/ai-agent-manifest.json'))"` → both valid JSON.
- `grep -n "auth.md\|oauth-protected-resource" public/llms.txt public/entity.json public/.well-known/ai-agent-manifest.json src/app/sitemap.ts` → present in all four.
- No existing test asserts the absence of these fields or an exact array/object shape that would break — confirmed via `src/__tests__/integration/metadata.test.ts`, `src/__tests__/sitemap.test.ts`.
- `npx tsc --noEmit`, `npm run lint`, full `vitest run`, `npm run build` — see chat for isolated-sandbox results.
