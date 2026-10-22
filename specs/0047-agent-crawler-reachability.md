# SPEC-0047: Agent and crawler reachability

## Why
A reachability audit (59 URLs) found things that stop recruiters, search engines and AI agents from reaching or telling apart the portfolio's most useful pages.

## Changes
1. robots.txt: every group (default and each named AI crawler) now allows `/api/resume-download`, `/api/mcp`, `/api/a2a` and `/api/context` as well as the existing demo allowances. Before, the resume link on /for-recruiters and the MCP and A2A endpoints advertised in llms.txt and the agent card were disallowed for robots-respecting agents. `/api/` stays disallowed otherwise.
2. Unique titles and descriptions plus canonical URLs for /recruiter-dashboard, /agent-marketplace, /agent-readiness, /demos/edge-agent-collaboration, /demos/agent-auth, /demos/storm-research and /demos/generative-ui (all previously shared the homepage title).
3. `/.well-known/security.txt` is served as `text/plain; charset=utf-8` (was `application/json`) via a `headers()` entry in `next.config.ts`; its Policy line points to the repository security policy instead of itself.
4. `/resume` redirects (307) to `/api/resume-download`.
5. `/testimonials` gets a visually hidden h1.
6. `scripts/verify-deploy.mjs` now also checks, on the live site: robots.txt groups still allow the four agent paths; the eight page titles are non-empty and distinct; security.txt is text/plain with Contact and Expires; `/resume` redirects.

## Follow-up (found by the new post-deploy check)
Production still served security.txt as application/json: `vercel.json` forces `Content-Type: application/json` on everything under `/.well-known/` and overrides the `next.config.ts` entry. The rule now excludes `security.txt` via a negative lookahead; every other well-known file keeps JSON and CORS. This edits `vercel.json` headers, which needs explicit approval.

## Out of scope
- Sitemap `lastmod`: it is generated at build time, so it reflects deploy date. Per-page dates need a content-date source and are left for a later change.
- Content wording (availability, revenue figures, call-centre claim, phone, resume PDF currency) is an owner decision.
- Pre-existing duplicated suffix in some titles (`... | Prasad Kavuri | Prasad Kavuri`, e.g. testimonials, governed-agent-platform) from the root title template.

## Approval note
Item 3 touches `next.config.ts` headers (a Content-Type for one file; no security header is changed). Review as deployment configuration.

## Verification
Unit tests in `metadata.test.ts` and `verify-deploy.test.mjs`; built and served locally and confirmed content type, redirect, robots output, titles; `verify-deploy` passes against the local build.
