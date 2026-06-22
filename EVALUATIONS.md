# Portfolio Quality Gates — EVALUATIONS.md

Last updated: 2026-06
Overall maturity score: **8.8 / 10** → Target: **9.8 / 10**

This document is the living scorecard for the portfolio. Update after every sprint or significant deployment. Each dimension has a gate (pass/fail threshold) and a current score.

---

## Dimensions

### 1. Recruiter Experience — 8.5 / 10

**Gate**: Every recruiter path step resolves to a live page with no 404s.

| Check | Status |
|-------|--------|
| `/for-recruiters` page loads | ✅ |
| `/recruiter-dashboard` page loads | ✅ |
| `/capabilities` page loads | ✅ |
| `/governance` page loads | ✅ |
| `/demos/evaluation-showcase` loads | ✅ |
| Contact / book-a-call CTA present | ✅ |
| Navbar "Demos" links to `/demos` | ✅ |
| Hero CTA links to `/demos` | ✅ |

**Score rationale**: Path is complete. Gap: recruiter landing copy not A/B tested; no explicit "apply here" CTA flow tested with real recruiters.

**To reach 9.5**: Add recruiter-specific keywords from top 3 target JDs (Anthropic, OpenAI, Stripe). Run recruiter-review skill for each.

---

### 2. Agentic SEO / AI Discoverability — 8.0 / 10

**Gate**: ChatGPT and Claude return accurate answers to "Who is Prasad Kavuri?" and "What AI demos has he built?"

| Asset | Status |
|-------|--------|
| `public/llms.txt` exists | ✅ |
| `llms.txt` has all 5 required sections | ✅ |
| `ai-agent-manifest.json` schema_version ≥ 1.1 | ✅ |
| JSON-LD `@graph` with Person + SoftwareApplications | ✅ |
| `sitemap.xml` covers all pages | ✅ |
| `robots.txt` allows llms.txt | ✅ |
| speakable cssSelector has ≥ 6 elements | ✅ |
| ChatGPT accuracy score ≥ 4/5 | 🔲 (needs re-test post ADR-0006 deploy) |
| Claude accuracy score ≥ 4/5 | 🔲 (needs re-test) |

**Score rationale**: All assets are present. Gap: accuracy testing not re-run since llms.txt rewrite. llms-full.txt not yet created.

**To reach 9.0**: Create `llms-full.txt` with full experience narratives. Re-run LLM compatibility test (agentic-seo skill Phase 5).

---

### 3. Security — 9.2 / 10

**Gate**: 0 high/critical npm audit vulnerabilities. All API routes rate-limited and guardrailed.

| Check | Status |
|-------|--------|
| `npm audit --audit-level=high` → 0 findings | ✅ |
| All API routes have `enforceRateLimit` | ✅ |
| All user-input routes have `enforceGuardrails` | ✅ |
| IP hashing (SHA-256) in rate-limit.ts | ✅ |
| No raw IPs in Redis keys | ✅ |
| CSP present in next.config.ts AND proxy.ts | ✅ |
| `X-Frame-Options: DENY` | ✅ |
| `X-Content-Type-Options: nosniff` | ✅ |
| `Strict-Transport-Security` header | ✅ |
| No secrets in public files | ✅ |
| `dangerouslySetInnerHTML` with sanitizer only | ✅ |
| semgrep OWASP scan | 🔲 (not yet automated in CI) |
| gitleaks secret scan | 🔲 (not yet in CI) |

**Score rationale**: Application controls are strong. Gap: semgrep and gitleaks not automated in CI — rely on manual review.

**To reach 9.8**: Add semgrep and gitleaks to `.github/workflows/ci.yml`. Run security-review skill and update docs/security.md.

---

### 4. Testing — 9.0 / 10

**Gate**: Unit coverage global ≥ 80%. API routes ≥ 90% statements. lib ≥ 95% functions.

| Metric | Target | Current |
|--------|--------|---------|
| Unit tests (Vitest) | pass | ✅ pass |
| Fuzz tests | pass | ✅ pass |
| Eval tests | pass | ✅ pass |
| E2E (Playwright, 4 browsers) | pass | ✅ pass |
| Global statements coverage | ≥ 80% | ~92% |
| Global branches coverage | ≥ 80% | ~88% |
| Global functions coverage | ≥ 80% | ~90% |
| API routes statements | ≥ 90% | ~91% |
| lib functions | ≥ 95% | ~100% |
| Component tests (3 new) | exist | ✅ AIArchitecture, DemosGallery, Experience |

**Score rationale**: Coverage gates met. Gap: no Storybook visual regression; E2E doesn't cover all 15 demo pages (smoke only).

**To reach 9.5**: Add E2E smoke test for `/demos/llm-router` and `/demos/multimodal`. Consider visual regression with Playwright screenshots.

---

### 5. Accessibility — 9.5 / 10

**Gate**: Playwright axe-core reports 0 critical violations on homepage, /demos, /governance.

| Check | Status |
|-------|--------|
| Skip-link on `/demos` | ✅ |
| All filter buttons have `aria-pressed` | ✅ |
| Layer toggles have `aria-expanded` | ✅ |
| Layer toggles have `aria-label` | ✅ |
| All images have `alt` text | ✅ |
| Focus rings visible (Tailwind focus utilities) | ✅ |
| axe-core 0 critical violations (automated) | ✅ |
| Lighthouse accessibility ≥ 95 | 🔲 (needs re-run post June changes) |

**Score rationale**: Strong baseline. Gap: Lighthouse score not re-run after June UI changes.

**To reach 9.8**: Re-run Lighthouse. Add `lang` attribute check. Verify mobile screen reader (VoiceOver) navigation.

---

### 6. Performance — 8.5 / 10

**Gate**: Lighthouse performance ≥ 90 on desktop, ≥ 80 on mobile.

| Metric | Target | Status |
|--------|--------|--------|
| Lighthouse performance (desktop) | ≥ 90 | 🔲 needs re-run |
| Lighthouse performance (mobile) | ≥ 80 | 🔲 needs re-run |
| CLS < 0.1 | < 0.1 | 🔲 needs re-run |
| LCP < 2.5s | < 2.5s | 🔲 needs re-run |
| WASM demos show `BrowserAIWarning` on mobile | ✅ | |

**Score rationale**: No recent Lighthouse run since June changes (new sections add render weight).

**To reach 9.0**: Run Lighthouse post-deploy. Lazy-load AIArchitecture section (14 layers add DOM). Confirm no CLS from FadeUp animations.

---

### 7. Documentation — 9.0 / 10

**Gate**: AGENTS.md, CLAUDE.md, CONTEXT.md, ADRs, and skills are complete and consistent.

| Asset | Status |
|-------|--------|
| AGENTS.md — domain language section | ✅ |
| CONTEXT.md — 45+ terms | ✅ (expanded June 2026) |
| ADR-0001 through ADR-0010 | ✅ (all 10 present) |
| skills/add-demo | ✅ |
| skills/redesign-portfolio | ✅ |
| skills/testing | ✅ |
| skills/security-review | ✅ |
| skills/agentic-seo | ✅ |
| skills/recruiter-review | ✅ |
| skills/executive-review | ✅ |
| docs/ARCHITECTURE.md | ✅ |
| docs/SECURITY_THREAT_MODEL.md | ✅ |
| docs/testing.md | 🔲 (generate via testing skill) |
| docs/security.md | 🔲 (generate via security-review skill) |
| docs/discoverability.md | 🔲 (generate via agentic-seo skill) |

**Score rationale**: Core docs complete. Gap: three generated reports (testing.md, security.md, discoverability.md) not yet created.

**To reach 9.5**: Run testing skill → generate docs/testing.md. Run security-review skill → generate docs/security.md. Run agentic-seo skill → generate docs/discoverability.md.

---

### 8. Executive Readiness — 8.8 / 10

**Gate**: An executive persona simulation (executive-review skill) returns "would schedule a call" probability ≥ 75% for at least 3 target personas.

| Persona | Simulated | "Schedule a call" |
|---------|-----------|------------------|
| Dario Amodei (Anthropic) | 🔲 | — |
| Sam Altman (OpenAI) | 🔲 | — |
| Patrick Collison (Stripe) | 🔲 | — |
| Thomas Dohmke (GitHub) | 🔲 | — |
| Satya Nadella (Microsoft) | 🔲 | — |
| Joe Heck (Board/PE) | 🔲 | — |

**Score rationale**: Portfolio content is strong. Gap: no formal persona simulation run yet — current score is estimated from content audit, not simulation output.

**To reach 9.5**: Run executive-review skill for Dario Amodei, Patrick Collison, Joe Heck. Address top concern from each.

---

## Sprint History

| Sprint | Date | Changes | Score before | Score after |
|--------|------|---------|-------------|-------------|
| PR1-PR3 | 2026-05 | Foundation, security, observability | ~7.0 | 7.8 |
| PR4-PR10 | 2026-06 | UI overhaul, SEO, a11y, tests | 7.8 | 8.8 |
| Matt Pocock skills | 2026-06 | CONTEXT.md, ADRs 1-4, add-demo skill | 8.8 | 8.9 |
| ChatGPT gap sprint | 2026-06 | CONTEXT.md expanded, ADRs 5-10, 6 skills, EVALUATIONS.md | 8.9 | ~9.2 (estimated) |
| Agent-Native Sprint 1 | 2026-06 | profiles/, evaluations/ YAML, runs/, self-heal skill, AGENTS.md | ~9.2 | ~9.4 (estimated) |
| Sprint 2 — Gap closure | 2026-06 | llms-full.txt enhanced, CI semgrep+gitleaks, E2E demos-pages, runs/ first record | ~9.4 | ~9.5 (estimated) |

---

## How to use this file

1. Run each skill listed above (testing, security-review, agentic-seo, executive-review)
2. Update the status column with real results
3. Recalculate dimension scores
4. Update the overall maturity score at the top
5. Add the sprint to the history table
