# Prasad Kavuri Portfolio — Agentic SEO, Recruitment Reachability, Security & Infrastructure Audit

**Scope:** Strictly read-only. No code execution, no package installs, no git commands, no writes other than this report. All local findings are from static file inspection; all live findings are from public HTTPS GET requests plus one same-origin `fetch()` header inspection executed by the browser itself (not a tool-level HEAD request), captured 2026-09-15.

---

## Local Baseline

- **Branch:** `main` (`.git/HEAD` → `ref: refs/heads/main`). Commit metadata was not derived via `git log` (execution prohibited under this audit's rules) and is therefore **Unverified** in this report.
- **Framework/runtime (from `package.json`):** Next.js `16.3.5` (exact pin, no `^`), React `^19.2.8` (caret — not exact-pinned), TypeScript `6.0.3`, Tailwind CSS `^4.2.4`.
- **Lockfile check:** `package-lock.json` resolves `react`/`react-dom` at `^19.2.8` and `next` at `16.3.5` — matches `package.json` exactly. No dependency drift found (High confidence).
- **Canonical profile source:** `src/data/profile.json`.
- **Metadata/JSON-LD source:** `src/app/layout.tsx` (root `@graph`), plus route-level `page.tsx` files.
- **Crawler assets:** `public/llms.txt`, `public/llms-full.txt`, `public/entity.json`, `public/.well-known/ai-agent-manifest.json`, `public/resume.md`, `public/resume.json`, `src/app/ai-profile.json/route.ts`.
- **Sitemap/robots source:** `src/app/sitemap.ts`, `public/robots.txt`.
- **Security-header source:** `next.config.ts` (`headers()`), `src/proxy.ts` (`applySecurityHeaders`).
- **Recruiter-facing page sources:** `src/app/for-recruiters/page.tsx`, `src/app/recruiter-dashboard/page.tsx`, `src/app/agent-marketplace/page.tsx`.

---

## Pillar 1 — Agentic SEO and LLM Discoverability

### Current State

The machine-readable surface is unusually thorough for a personal portfolio: `llms.txt`, `llms-full.txt`, `entity.json`, `ai-profile.json`, a `.well-known/ai-agent-manifest.json`, a callable MCP tool endpoint (`/api/mcp-demo`), a JSON-LD `@graph` covering `Person`, `WebSite`, two `Organization` entities, 15 `SoftwareApplication` demo entities, and `WebPage` entities for `recruiter-dashboard` and `agent-marketplace`. `robots.txt` explicitly allow-lists 20 named AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) with access to `/api/context` and `/api/mcp-demo`. Current role, employer, and headline metrics are consistent and correct across `entity.json`, `llms.txt`, `llms-full.txt`, `resume.md`, `resume.json`, `ai-agent-manifest.json`, and the root JSON-LD — all verified live and matching the local repository content exactly (see Reconciliation Table).

### Gaps Identified

1. **Self-contradicting layer count in the AI-agent manifest (live and local).** `public/.well-known/ai-agent-manifest.json` line 128 sets `"layers_documented": 14`, while the adjacent `description` field (line 129, same object) reads "Interactive **15**-layer AI platform architecture" and lists all 15 stages including "adaptive AI governance." This is a direct internal contradiction in a single machine-readable field an LLM agent would parse programmatically — not just a stale prose count. Confirmed live at `/.well-known/ai-agent-manifest.json` (fetched 2026-09-15) — identical to the local file, so this is deployed, not a build lag.
   - **Evidence:** `public/.well-known/ai-agent-manifest.json:128-129`; live `https://www.prasadkavuri.com/.well-known/ai-agent-manifest.json` (2026-09-15).
   - **Confidence:** High.

2. **`/agent-marketplace` serves stale title/description/OG metadata live**, despite the July 2026 title rollout being complete everywhere else checked. Live `<title>` reads "Prasad Kavuri — **VP / Head of AI Engineering**" (the oldest historical title, pre-dating even the "Director, AI Platform & Agentic Solutions" interim title), the meta description omits Zip entirely ("VP-level AI engineering executive... Built agentic AI platforms at Krutrim/Ola"), and the Twitter description says "15 production demos" instead of the canonical 16. This page is also one of the two pages given a dedicated `WebPage` JSON-LD entity in `layout.tsx` and is prominently listed as a primary entry point in `ai-agent-manifest.json`'s `links` object and in `llms.txt`'s `ENTRY POINTS` section — so it is not a low-traffic page from an agent-discovery standpoint.
   - The string "VP / Head of AI Engineering" does **not** appear anywhere in `src/app/agent-marketplace/page.tsx`, and the response header `x-nextjs-prerender: 1` with `age: 1` at fetch time indicates this is a freshly-served static render, not a stale CDN cache from before the title rollout — meaning the stale text is coming from the current deployed build via a metadata source this audit did not localize (no `generateMetadata`/`export const metadata` was found in `page.tsx` itself; it may be composed elsewhere, e.g. a shared metadata helper or a file not covered by this pass). Recommend a direct `grep -r "VP / Head of AI Engineering" src/app/agent-marketplace` follow-up outside this audit to find the exact source.
   - **Evidence:** Live `https://www.prasadkavuri.com/agent-marketplace` (fetched 2026-09-15, `<title>`, `og:description`, `twitter:description`, `x-nextjs-prerender`/`age` response headers); local `src/app/agent-marketplace/page.tsx` (no matching metadata block found).
   - **Confidence:** High (observation) / Medium (root cause location).

3. **`sitemap.xml` omits `/recruiter-dashboard` and `/agent-marketplace`** — both pages that `ai-agent-manifest.json`, `llms.txt`, and the root JSON-LD `@graph` treat as primary, promoted entry points (the manifest's `links` object lists `recruiter_dashboard` and `agent_marketplace` first among page links; `layout.tsx` gives `recruiter-dashboard` a dedicated `speakable` JSON-LD `WebPage` entity). Neither URL appears in `src/app/sitemap.ts`'s return array, and this was confirmed absent in the live `sitemap.xml` fetch as well. A crawler that only follows the sitemap (rather than following in-page/JSON-LD links) will not discover these two pages proactively.
   - **Evidence:** `src/app/sitemap.ts:1-69` (no `recruiter-dashboard` or `agent-marketplace` entries); live `https://www.prasadkavuri.com/sitemap.xml` (fetched 2026-09-15) — confirmed absent.
   - **Confidence:** High. **Impact:** Medium-High — these are exactly the pages the AI-crawler files tell agents to prioritize.

4. **`sitemap.xml` lists `/api/context` (priority 0.85), but `robots.txt`'s default `User-agent: *` group disallows all of `/api/`.** Only the 20 explicitly named AI bots get an `Allow: /api/context` override; a standard crawler that respects only the wildcard group (which is how Googlebot and Bingbot behave unless a bot-specific group is present for them — none is) would see `/api/context` submitted in the sitemap yet blocked by robots.txt. This is the specific pattern Google Search Console flags as "Submitted URL blocked by robots.txt."
   - **Evidence:** `public/robots.txt:1-3` (wildcard group disallows `/api/`, no `Googlebot`-specific group is defined); `src/app/sitemap.ts:47`; live `robots.txt` and `sitemap.xml` fetches confirm the same structure is deployed.
   - **Confidence:** High. **Impact:** Medium (affects one non-critical URL, but is a textbook indexing-hygiene finding).

5. **`recruiter_query_match` phrase lists differ in length between `entity.json` (14 phrases, includes "sovereign AI platform leader") and `ai-agent-manifest.json` (13 phrases, omits it)** — both otherwise identical. Minor source drift between two files meant to be synchronized.
   - **Evidence:** `public/entity.json:64-79` vs `public/.well-known/ai-agent-manifest.json` (`recruiter_query_match` array, 13 entries).
   - **Confidence:** High. **Impact:** Low.

6. **The condensed public resumes (`resume.json`, `resume.md`, and the downloadable PDF) collapse all six HERE Technologies roles into a single "Director of Engineering" entry with no dates**, which is actually the *second-most-recent* HERE title per `profile.json` — the more recent "Head of Infrastructure and Services" (May–Sept 2023) is dropped entirely from the condensed view. An LLM summarizing only `resume.json`/`resume.md` (which several of the machine-readable files point agents toward as canonical) would understate the most recent HERE title.
   - **Evidence:** `src/data/profile.json:71-83` (`here-head`, "Head of Infrastructure and Services", May 2023 – Sept 2023) vs `public/resume.json:61-72` and `public/resume.md:40` (single "Director of Engineering" entry, no `here-head` title or dates); confirmed identical live.
   - **Confidence:** High. **Impact:** Medium — affects only the condensed resume surfaces, not the full site or `entity.json`/`profile.json`.

7. **`ai-agent-manifest.json`'s `security_audits.skill_scanner` block makes a specific, checkable claim** ("last_result": "SAFE", "last_score": 0) about a CI-driven scan (`.github/workflows/skill-security.yml`, SkillSpector by NVIDIA). The workflow file exists and is configured correctly (weekly cron + push/PR triggers, SARIF gate on HIGH/CRITICAL), but this audit cannot confirm the *actual last run result* without reading GitHub Actions run history, which is outside the read-only, same-origin-HTTPS scope defined for this audit.
   - **Confidence:** Unverified (workflow existence and configuration: High confidence, local file read; the specific claimed "last_result": "SAFE" is Unverified).

### Evidence

See inline citations above; all local paths are relative to the repository root, all live fetches were performed 2026-09-15 between roughly 16:18–16:35 UTC (see individual timestamps where distinct).

### Priority Recommendations

#### High Impact
- Fix the `layers_documented: 14` field in `public/.well-known/ai-agent-manifest.json` to `15` (trivial, one-line, matches the adjacent description already on the same file).
- Refresh `/agent-marketplace`'s title/description/OG/Twitter metadata to the current "Head of AI Platform & Agentic Solutions" / Zip framing, and locate the actual metadata source (not found in `page.tsx` during this audit).
- Add `/recruiter-dashboard` and `/agent-marketplace` to `src/app/sitemap.ts`.

#### Medium Impact
- Either remove `/api/context` from the sitemap, or add an explicit `User-agent: Googlebot` / `Bingbot` group to `robots.txt` that allows it, so the sitemap and robots.txt don't disagree for standard crawlers.
- Reconcile the `recruiter_query_match` arrays between `entity.json` and `ai-agent-manifest.json`.
- Decide whether the condensed resume surfaces should show "Head of Infrastructure and Services" as the final HERE title, or explicitly note the title progression.

#### Low Impact
- None beyond the above; this pillar is otherwise in strong shape.

---

## Pillar 2 — Human Recruiter UX and Reachability

### Current State

The homepage communicates current title, employer, and three headline metrics (200+ engineers, 70% cost reduction, $10M+ revenue) above the fold, confirmed via live rendering. `/for-recruiters` leads with a clear value proposition, a 5-step "Recommended Path," an explicit "Strong Fit / Not a Fit" section (a genuinely useful, uncommon pattern that pre-qualifies recruiter time), and multiple contact surfaces (LinkedIn, GitHub, email, Calendly). The resume download, LinkedIn, GitHub, and Calendly links all resolve live.

### Gaps Identified

1. **`/recruiter-dashboard` displays "Actively interviewing" and a "Compensation context" panel listing "VP / Head level band," "Equity participation expected," and budget-ownership figures** — live and hardcoded. This directly contradicts the softened, non-active-search positioning decision made deliberately elsewhere in this codebase this year: the Hero banner was changed from "Available Now · Actively Evaluating Opportunities" to "Currently at Zip · Always Happy to Talk AI Platform Strategy," and the résumé PDF had its "Open to..." framing removed specifically because Prasad is currently employed at Zip (joined July 2026). `/recruiter-dashboard` was evidently not included in that pass and now says the opposite of the rest of the site on the single most sensitive claim a currently-employed executive can make in public.
   - **Evidence:** `src/app/recruiter-dashboard/page.tsx:195` (`Actively interviewing`), `:251` (`'VP / Head level band'`); confirmed live at `https://www.prasadkavuri.com/recruiter-dashboard` (fetched 2026-09-15).
   - **Confidence:** High. **Impact:** High — this is a live, public, currently-employed-executive page claiming active job search, which is both inconsistent with the rest of the site and carries real professional risk if seen by a current employer or colleague.

2. **`/for-recruiters`'s own "Recommended Path" does not match the reference recruiter flow this audit was asked to evaluate** (`/for-recruiters → /recruiter-dashboard → /capabilities → /governance → /demos/evaluation-showcase → /contact`). The page's actual 5 steps link to `/capabilities → /demos/evaluation-showcase → /enterprise-ai-operating-model → /governance → Calendly` (a direct booking link, not `/contact`), and never mention `/recruiter-dashboard` at all — even though `/recruiter-dashboard` is a fully built, live page that the AI-crawler files treat as the primary recruiter surface. A human recruiter following the page's own stated path would never be routed to `/recruiter-dashboard`.
   - **Evidence:** `src/app/for-recruiters/page.tsx:260,267,274,281,288` (step `href` values).
   - **Confidence:** High. **Impact:** Medium — not necessarily a bug (may be intentional that the dashboard is a separate, AI-agent-oriented surface), but worth an explicit decision either way, especially in light of finding #1 above.

3. **Duplicate/parallel recruiter entry points** (`/for-recruiters` and `/recruiter-dashboard`) carry materially different tone and claims (one softened/employed, one actively-interviewing) and are not cross-linked in a single coherent path. `/recruiter-dashboard` does link back to `/for-recruiters` ("Recruiter Brief"), but `/for-recruiters` does not link forward to `/recruiter-dashboard`.
   - **Confidence:** High. **Impact:** Medium (compounds finding #1).

### Evidence

See inline citations above.

### Priority Recommendations

#### High Impact
- Remove or rewrite the "Actively interviewing" badge and "Compensation context" panel on `/recruiter-dashboard` to match the current-employment framing used everywhere else on the site.

#### Medium Impact
- Reconcile `/for-recruiters`'s "Recommended Path" with the actual existence and purpose of `/recruiter-dashboard` — either link to it explicitly or clarify the two pages' distinct audiences.
- Add `/contact` (or clarify the Calendly-only pattern is intentional) to the end of the `/for-recruiters` path if a stated intent is to route to a general contact page rather than straight to booking.

#### Low Impact
- Consider a two-way link between `/for-recruiters` and `/recruiter-dashboard`.

### Unverified

- Mobile scanning experience, actual click-through behavior, and whether recruiters in practice land on `/for-recruiters` vs `/recruiter-dashboard` first are **Unverified** — this audit only inspected static rendered output, not device emulation or analytics.

---

## Pillar 3 — Security and Privacy Posture

### Current State

`next.config.ts` and `src/proxy.ts` define a consistent, fairly strict header set (CSP, COOP `same-origin`, COEP `credentialless`, HSTS with `preload`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` disabling camera/mic/geolocation/payment/usb/serial). **All of these were confirmed live** via a same-origin `fetch('/')` executed in-browser against `https://www.prasadkavuri.com/`, and the values matched the local config exactly. `SECURITY.md` documents a real, non-trivial set of AI-specific controls (prompt-injection heuristics in `src/lib/guardrails.ts`, SSRF/DNS-rebinding defenses in `src/lib/url-security.ts`, rate limiting with SHA-256-hashed IPs, redirect-hop limits). No hardcoded secrets, API keys, or private-key material were found in the files read during this audit — consistent with this audit's Agent Sandbox Contract restriction against reading `.env*`, credential files, or secrets directly, no repository exposure was verified beyond the source files explicitly listed in "Files and URLs Reviewed" below. Rate limiting is implemented at both the proxy layer (`src/proxy.ts`, 60 req/min per hashed client) and referenced at the route layer.

### Gaps Identified

1. **`SECURITY.md`'s own "Known Advisories" entry makes two verifiably incorrect claims about the current dependency state it is supposed to be documenting.** Under CVE-2026-23864 (React RSC DoS), the mitigation text states: "Patched baseline: `react@19.2.6` and `next@16.2.4`... **`react` and `react-dom` are pinned to exact version `19.2.6` (no `^` caret)**." But `package.json` currently pins `react`/`react-dom` at **`^19.2.8`** (with a caret — not exact-pinned at all) and `next` at `16.3.5`. The version numbers are stale by two patch releases, and the "no caret" claim is currently false for React (only `next` is caret-free in the actual manifest). A security document making an inaccurate regression-prevention claim is a worse outcome than no claim at all, since it could give a false sense that a downgrade would be caught by the pinning strategy when it currently would not be (semver-compatible `npm update` could legally move React within the `^19.2.8` range without violating the stated pin).
   - **Evidence:** `SECURITY.md:107-108`; `package.json:32-33` (`"react": "^19.2.8"`, `"react-dom": "^19.2.8"`).
   - **Confidence:** High. **Impact:** High for a security-posture document specifically, though the underlying CVE mitigation claim ("Not exploitable — zero `"use server"` directives") was not independently re-verified in this audit (would require a repo-wide search for `"use server"`, which is in scope for a follow-up but was not performed here — **Unverified**).

2. **`Access-Control-Allow-Origin: *` is present on the homepage document response** (confirmed via same-origin header inspection). This is not set anywhere in `next.config.ts` or `src/proxy.ts` — it does not appear in either file's header list — so it is most likely a Vercel platform-level default for cached/prerendered HTML responses rather than an application-level CORS misconfiguration. Because the response carries no cookies or session state and the page is public marketing content, the practical exploitability is low, but it should be confirmed as platform-default behavior (e.g., against Vercel's own documentation) rather than assumed, since this audit cannot distinguish "Vercel default" from "someone configured it" through static file inspection alone.
   - **Evidence:** Live same-origin `fetch('/')` response headers (`access-control-allow-origin: *`), captured 2026-09-15; absent from `next.config.ts:19-86` and `src/proxy.ts:29-47`.
   - **Confidence:** Medium (observed fact is High confidence; attribution to "platform default vs. configuration" is inferred, not directly provable via available tools).

3. **Requires runtime/package audit verification:** this audit cannot run `npm audit`, so no claim is made here about currently-known vulnerable packages beyond what `SECURITY.md` itself documents. The repository's own `CLAUDE.md`/`AGENTS.md` require `npm audit --audit-level=high` with zero high/critical findings before every commit, which — if actually enforced in CI — would cover this; whether CI is currently green is **Unverified** under this audit's constraints (no GitHub Actions run history was read).

4. **`SECURITY.md`'s Known Advisories table lists only one CVE** (CVE-2026-23864). Given `package.json` shows `next` was very recently moved to `16.3.5`, it is worth confirming (outside this audit, since it requires either `npm audit` or reading commit/PR history) whether that version bump was itself advisory-driven and, if so, whether it should also appear in this table. This is a recommendation to verify, not a finding, since this audit's tooling cannot confirm the reason for the version bump.

### Evidence

See inline citations above. Live security-header confirmation was captured via a same-origin `fetch()` executed by the browser itself while rendering `https://www.prasadkavuri.com/`, not via a tool-level HTTP HEAD request — the header names/values are the authoritative live response headers as seen by any standard browser or crawler.

### Priority Recommendations

#### High Impact
- Correct `SECURITY.md`'s stated React version (`19.2.6` → actual current) and its "no caret" pinning claim (currently false — React is caret-pinned, only Next.js is exact-pinned).

#### Medium Impact
- Confirm whether `Access-Control-Allow-Origin: *` on HTML responses is a Vercel platform default or a configuration choice, and document it either way in `SECURITY.md` so the omission from `next.config.ts`/`proxy.ts` isn't mistaken for an oversight.
- Confirm current `npm audit --audit-level=high` status (requires running the audit — outside this report's scope; flagged as "Requires runtime/package audit verification").

#### Low Impact
- Consider adding a changelog note or advisory-table entry whenever a dependency bump is specifically security-motivated, for traceability.

### Confidence and Verification Limits

- **Confirmed (High confidence, live + local agreement):** CSP, COOP, COEP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection.
- **Confirmed (local only):** rate-limiting logic, guardrails/SSRF code structure, no hardcoded secrets in files read.
- **Unverified (requires runtime/authenticated tooling):** `npm audit` output, GitHub Actions run history/CI status, actual SkillSpector last-run result, whether the `next` 16.3.5 bump was CVE-driven.

---

## Pillar 4 — Software and Infrastructure Modernization

### Current State

Next.js 16.3.5 (App Router + Turbopack), React `^19.2.8`, TypeScript 6.0.3, Tailwind CSS `^4.2.4`. The four browser-AI demos (RAG, Vector Search, Multimodal, Quantization) run client-side via Transformers.js/ONNX/WebGPU, isolated from server-side demos per `CLAUDE.md`'s documented architecture rule. `sitemap.ts` derives demo URLs dynamically from `src/data/demos.ts` rather than hardcoding them (good — reduces the exact class of drift found elsewhere in this report). The homepage response is served from Vercel's edge cache (`x-vercel-cache: HIT`, `x-nextjs-prerender: 1`), which is good for TTFB and crawler timeout risk.

### Gaps Identified

1. **The downloadable résumé PDF's filename/URL still contains the legacy slug** `prasad-kavuri-vp-ai-engineering-2026.pdf` — the file's actual *content* is fully current (confirmed live: correct title, correct Zip dates, no active-search language, 16 demos, matches `resume.md`/`resume.json` exactly), but the URL itself is a visible, indexable artifact that says "vp-ai-engineering." This was previously identified and deliberately deferred earlier in this project's history due to the cascading rename effort (Navbar links, the API route's `Content-Disposition` header, `entity.json`'s `resume_pdf` field, and tests would all need updating together) — flagging it here again since it remains live and unresolved, and repo-based instructions note it directly (see `entity.json:21`).
   - **Confidence:** High. **Impact:** Low-Medium (cosmetic/URL-only; content is correct).

2. **No dedicated performance/Core Web Vitals data was available under this audit's read-only constraints** — Vercel Speed Insights is wired in (`@vercel/speed-insights/next` in `layout.tsx`), which is the correct instrumentation choice, but its dashboard data was not accessible via public HTTPS GET/HEAD. **Unverified.**

3. **Homepage third-party script surface:** the live homepage loads a `/3f3665895dda6343/script.js` first-party-hosted script in addition to `/_vercel/insights/script.js`. This audit could not determine its purpose from a black-box network trace alone (it did not match Vercel Analytics/Speed Insights' typical naming, and no corresponding CSP `connect-src`/`script-src` entry stands out as unusual, since `next.config.ts`'s CSP already scopes `script-src` to `'self'` plus a short allow-list). Recommend a source-level check of what emits this filename (likely a hashed analytics or A/B-testing script) to confirm it's expected. **Unverified** as to origin/purpose from this audit alone.

4. **Duplicate JSON-LD/metadata implementation pattern**: metadata is defined both in `layout.tsx`'s root JSON-LD `@graph` and independently across many route-level files (each demo's `opengraph-image.tsx`, `entity.json`, `ai-agent-manifest.json`, `llms.txt`/`llms-full.txt`, `resume.json`/`resume.md`). This is architecturally the root cause of nearly every discrepancy found in Pillar 1 (the "14 vs 15 layers" self-contradiction, the stale `/agent-marketplace` metadata, the sitemap omissions) — there is no single source of truth for machine-readable surfaces the way `src/data/profile.json` is the source of truth for profile content. This is a design observation, not a single fixable bug.
   - **Confidence:** High (structural observation, consistent with every Pillar 1 finding above).
   - **Impact:** Medium-High long-term — every future edit to role/title/counts risks re-introducing exactly this class of drift unless the machine-readable files are generated from `profile.json`/`site-config.ts` rather than hand-maintained in parallel.

### Evidence

See inline citations above and Pillar 1 findings, which are largely instances of gap #4 here.

### Priority Recommendations

#### High Impact
- None specific to this pillar beyond what's already covered in Pillars 1–3 (which are largely downstream of gap #4 here).

#### Medium Impact
- Consider generating `entity.json`, `ai-agent-manifest.json`, and the OG/Twitter metadata for `/agent-marketplace` and `/recruiter-dashboard` from `src/data/profile.json`/`site-config.ts` at build time rather than hand-maintaining parallel copies, to prevent recurrence of the Pillar 1 findings.
- Investigate the `/3f3665895dda6343/script.js` first-party script to confirm its purpose.

#### Low Impact
- Resolve the résumé PDF filename when convenient (requires coordinated changes across Navbar, API route, `entity.json`, and tests — not a quick fix).

---

## Repository-to-Live Reconciliation Table

| Property | Local source | Live source | Alignment status | Impact | Confidence |
|---|---|---|---|---|---|
| Current title | `src/data/profile.json:4` ("Head of AI Platform & Agentic Solutions") | `https://www.prasadkavuri.com/` `<title>`, JSON-LD `jobTitle` (fetched 2026-09-15) | **Aligned** | — | High |
| Current employer | `src/data/profile.json:24` ("Zip") | Homepage body text, `entity.json` live | **Aligned** | — | High |
| Role dates (Zip) | `src/data/profile.json:27` ("July 2026 - Present") | `resume.json`/`resume.md`/homepage live | **Aligned** | — | High |
| Demo count | `src/data/site-config.ts` `PORTFOLIO_FACTS.productionDemoCount` (referenced, value not independently re-derived in this pass) → 16 across `entity.json`, `llms.txt`, `resume.md` | Homepage live text "16 production demos"; `/agent-marketplace` live shows 15 (see Pillar 1 #2) | **Source drift** (marketplace vs. rest of site) | Medium | High |
| Architecture layer count | `src/components/sections/AIArchitecture.tsx` (15 layers, confirmed this session's prior work) | Homepage live: "traverses **15** layers," "ALL 15 LAYERS ARE LIVE" | **Aligned** | — | High |
| — but — `ai-agent-manifest.json` internal field | `public/.well-known/ai-agent-manifest.json:128` `"layers_documented": 14` vs `:129` description "15-layer" | Live file identical — same self-contradiction deployed | **Source drift** (within a single file) | High | High |
| Canonical URLs | `src/data/site-config.ts` `SITE_URL` (www), `DESIGN.md` "All URLs use https://www.prasadkavuri.com (with www)" | Live canonical tag, OG `url`, JSON-LD `@id`s all use `www.` consistently | **Aligned** | — | High |
| Contact links (LinkedIn/GitHub/email/Calendly) | `src/data/profile.json:8-10`, `src/lib/tracking.ts` `CALENDLY_URLS` | Homepage, `/for-recruiters`, `/recruiter-dashboard` live — all resolve | **Aligned** | — | High |
| Security headers | `next.config.ts:19-86`, `src/proxy.ts:29-47` | Live same-origin `fetch()` response headers (CSP, HSTS, COOP, COEP, X-Frame-Options, etc.) | **Aligned** | — | High |
| Sitemap coverage of promoted AI-agent entry points | `src/app/sitemap.ts` (no `recruiter-dashboard`/`agent-marketplace` entries) | Live `sitemap.xml` — same omission | **Live-only** (pages exist and are live, but **absent from sitemap** on both sides) | Medium-High | High |
| Recruiter positioning tone | Hero banner / résumé: softened, currently-employed framing (this session's prior work) | `/recruiter-dashboard` live: "Actively interviewing," "VP / Head level band" | **Source drift** (one page contradicts the rest of the site) | High | High |

### Notes on the table

- No **deployment lag** was found anywhere this audit checked — every local file read matched its live counterpart byte-for-byte in content (allowing for the live JSON's `"generated"` timestamp field on `ai-profile.json`, which is dynamically stamped per-request and is expected to differ). This means the two "drift" rows above (`layers_documented: 14` and `/agent-marketplace` staleness) are **not** explained by an un-deployed fix sitting in the repo — they are genuinely live, current-build issues.
- The `/recruiter-dashboard` "Actively interviewing" row is the one finding in this table that isn't a *local-vs-live* mismatch at all — it's a **live page directly contradicting other live pages** (and the deliberate positioning decisions made elsewhere in the codebase). It's included here because it's the highest-impact single finding in this audit.

---

## Executive Summary

The portfolio's core identity claims — current title, employer, dates, headline metrics, canonical URLs, and security headers — are accurate, consistent, and correctly deployed everywhere this audit checked, which is a strong foundation for both human-recruiter and AI-agent reachability. The agentic-SEO surface (JSON-LD, `llms.txt`/`llms-full.txt`, `entity.json`, a callable MCP endpoint, a 20-bot-aware `robots.txt`) is more thorough than the vast majority of executive portfolios and is a genuine differentiator for "AI-friendly profile" positioning.

The gaps found cluster around one root cause: **machine-readable and page-level metadata is hand-maintained in parallel across many files instead of generated from a single source**, and one of those parallel copies (`/agent-marketplace`) and one internal field (`ai-agent-manifest.json`'s `layers_documented`) were missed during otherwise-thorough recent update passes. The single highest-priority issue is **`/recruiter-dashboard` publicly claiming "Actively interviewing" with VP/Head-level compensation expectations**, which is live, real, and directly contradicts the currently-employed, softened positioning used everywhere else on the site — this is the one finding in this report with genuine professional-risk implications and should be addressed first, independent of the SEO/infrastructure items.

None of the findings in this audit are structural security vulnerabilities; the security posture (headers, guardrails, SSRF defenses, rate limiting) is real and correctly deployed. The one security-adjacent finding of note is that `SECURITY.md` itself contains an inaccurate claim about the current dependency-pinning strategy, which is a documentation-integrity issue rather than an exploitable weakness.

### Critical Findings Requiring Immediate Attention

1. `/recruiter-dashboard` shows "Actively interviewing" and VP/Head-level compensation expectations, contradicting the site's deliberate current-employment positioning. (Pillar 2, High impact.)
2. `ai-agent-manifest.json` self-contradicts on the architecture layer count (`14` field vs. `15` description) in a file specifically built for programmatic agent consumption. (Pillar 1, High impact.)
3. `/agent-marketplace` serves the oldest historical title ("VP / Head of AI Engineering") and omits Zip entirely in live metadata, despite being one of two pages given dedicated JSON-LD treatment. (Pillar 1, High impact.)

### Findings Requiring Runtime or Authenticated Verification

- Current `npm audit --audit-level=high` status.
- GitHub Actions CI status and the actual last SkillSpector scan result (claimed "SAFE" in `ai-agent-manifest.json`, not independently re-verified).
- Whether the `next` 16.3.5 version bump visible in `package.json` was itself security-motivated (would require reading commit/PR history or release notes, outside this audit's git-execution restriction).
- Origin/purpose of the `/3f3665895dda6343/script.js` first-party script observed on the live homepage.
- Whether `Access-Control-Allow-Origin: *` on HTML responses is a Vercel platform default or an explicit configuration choice.
- Git branch/commit metadata (not derived, per this audit's no-git-execution constraint).
- Mobile rendering, actual recruiter click-through behavior, and Core Web Vitals / Lighthouse scores.

### Files and URLs Reviewed

**Local files:** `src/data/profile.json`, `public/entity.json`, `public/llms.txt`, `public/llms-full.txt`, `public/resume.json`, `public/resume.md`, `public/.well-known/ai-agent-manifest.json`, `public/robots.txt`, `src/app/sitemap.ts`, `next.config.ts`, `src/proxy.ts`, `src/app/layout.tsx`, `package.json`, `package-lock.json`, `.github/dependabot.yml`, `.github/workflows/skill-security.yml`, `SECURITY.md`, `src/app/for-recruiters/page.tsx`, `src/app/recruiter-dashboard/page.tsx`, `src/app/agent-marketplace/page.tsx`, `.git/HEAD`.

**Live URLs (fetched 2026-09-15):** `/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, `/entity.json`, `/ai-profile.json`, `/resume.md`, `/resume.json`, `/.well-known/ai-agent-manifest.json`, `/for-recruiters`, `/recruiter-dashboard`, `/agent-marketplace`, `/prasad-kavuri-vp-ai-engineering-2026.pdf`. (`/about` and `/capabilities` and `/contact` were not individually fetched in this pass; their content was cross-checked indirectly via `entity.json`'s `canonical_urls` and the homepage/JSON-LD only — treat any implicit claims about those three specific pages as **Unverified**.)

### Audit Timestamp

- **Local audit timestamp:** 2026-09-15 (session date).
- **Live-resource retrieval window:** 2026-09-15, approximately 16:18–16:35 UTC.
