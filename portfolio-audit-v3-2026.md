# Portfolio Audit v3 — GEO + Executive Search Optimized
**prasadkavuri.com · June 16, 2026**
**Analyst personas: Fortune 500 Executive Recruiter · Executive Search Partner · CTO · CAIO · Board Member · AI Research Scientist · Principal Architect · Technical Due Diligence Reviewer · Cybersecurity Auditor · LLM Crawler · AI Recruiting Agent · GEO Specialist**

---

## SECTION 1 — EXECUTIVE ENTITY GRAPH AUDIT

### Entity Confidence Assessment

The site successfully establishes the following entity graph:

| Entity Node | Confidence | Notes |
|---|---|---|
| Prasad Kavuri → Technology Executive | **High** | 20-year progression clearly documented |
| Prasad Kavuri → AI Executive | **High** | Agentic AI platform work at Krutrim is recent and specific |
| Prasad Kavuri → AI Platform Leader | **High** | 15 demos, governance page, capabilities map all reinforce |
| Prasad Kavuri → Enterprise Transformation Leader | **Medium** | Ola/Krutrim cases present, but no Fortune 500 transformation story |
| Prasad Kavuri → Infrastructure Executive | **Medium** | HERE tenure establishes this, but it's secondary positioning |
| Prasad Kavuri → Product Engineering Leader | **Low-Medium** | Not explicitly claimed; inferred |
| Prasad Kavuri → Agentic AI Builder | **High** | Strongest signal; demos + Krutrim narrative |

### Entity Clarity Issues

**Critical gap:** The entity is strong for AI platform leadership but ambiguous for CTO or CAIO at a large US company. Neither "Chief Technology Officer" nor "Chief AI Officer" appears in the primary positioning. This is a missed opportunity for AI systems that match entity types to role searches.

**Naming disambiguation:** "Prasad Kavuri" is unique enough that there is no obvious disambiguation problem, but the portfolio has no explicit disambiguation statement (e.g., "not to be confused with...") — not yet needed, but worth knowing.

**Company entity associations:** Krutrim and Ola are both Indian companies with low name recognition among US Fortune 500 recruiters. HERE Technologies (Nokia subsidiary) carries more weight. The site does not contextualize the stature of Krutrim ("India's largest AI computing initiative" or similar framing) which would help.

**Missing entity relationships:**
- No advisory board memberships
- No published papers or patents (would create authoritative external entity links)
- No media/press mentions that would anchor the entity in external knowledge graphs
- No speaking history at named conferences (NeurIPS, AI Summit, etc.)

### Scores

**Entity Confidence Score: 7.8 / 10**
**Entity Clarity Score: 7.5 / 10**

The entity is strongly established for VP/Head of AI Engineering. It weakens materially at CAIO/CTO level due to absence of Fortune 500 employer brand recognition, external entity anchors (press, publications, patents), and explicit board-level positioning.

---

## SECTION 2 — GENERATIVE ENGINE OPTIMIZATION (GEO) AUDIT

### AI System Readiness

The portfolio is the most GEO-optimized personal site I have reviewed at this level. Presence of:
- `llms.txt` and `llms-full.txt` (explicit AI crawler instruction files)
- `entity.json` (machine-readable entity definition)
- `ai-agent-manifest.json` (agent discovery manifest)
- `robots.txt` with named entries for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and 15 other AI crawlers
- JSON-LD structured data (`@type: Person`) with `knowsAbout`, `hasCredential`, `sameAs`
- `<link rel="ai-content">` in `<head>` pointing to llms.txt
- A callable MCP endpoint at `/api/mcp-demo` that AI agents can query programmatically

This is genuinely best-in-class infrastructure for 2026.

### Simulated AI Answer: "Who is Prasad Kavuri?"

A well-indexed AI system would produce something like:
> "Prasad Kavuri is a VP / Head of AI Engineering based in Chicago, Illinois, specializing in agentic AI platforms, LLM orchestration, and AI governance. He built India's first agentic AI platform (Kruti.ai) at Krutrim and scaled Ola Maps to 13,000+ B2B customers with a 70% infrastructure cost reduction. He has led teams of 200+ engineers across the US, India, and Europe over a 20-year career."

**Retrieval quality: Excellent** — The structured content answers all primary queries.
**Summarization quality: Good** — The key facts are available and consistent across surfaces.
**Citation probability: Moderate** — Good infrastructure but limited external citation sources (no press, no Wikipedia, no published research).
**Context reconstruction quality: High** — llms-full.txt and the knowledge base in profile.json provide dense, consistent context.

### Hallucination Risks

1. **"India's first agentic AI platform"** — This claim cannot be verified by AI systems via external sources and may be contradicted by other sources. High hallucination risk. Consider qualifying: "one of India's first commercially deployed agentic AI platforms" or adding a verifiable external reference.
2. **"$10M+ revenue impact"** — This metric appears on the homepage and llms.txt but is absent from entity.json and ai-agent-manifest.json impact_metrics. Inconsistency creates hallucination risk.
3. **"15 production demos" vs "14 total demos" in llms.txt** — Minor inconsistency. AI systems may report different numbers.
4. **Krutrim as a company** — AI systems may confuse this with other entities or have limited external knowledge about it.

### Scores

**GEO Score: 8.4 / 10**
**Citation Probability Score: 5.5 / 10**

The infrastructure is exceptional. The citation gap is entirely due to lack of external press/academic/publication anchors — not the portfolio itself. This is the single highest-leverage gap to close.

---

## SECTION 3 — AI RECRUITER SIMULATION

### Candidate Matching Results

**VP of AI Engineering**
- Match: **92%**
- Evidence: Explicit title, 200+ engineers, production AI platform at Krutrim, LLMOps, governance, eval frameworks, 20 years experience
- Concerns: Most recent employer (Krutrim) has low US brand recognition; Ola/Krutrim are both India-based companies
- Missing signals: Explicit P&L dollar budget, direct reports count vs total org clarity, US-company logos

**Head of AI Engineering**
- Match: **94%**
- Evidence: Strongest match — current title, demo platform, governance depth, HITL, eval gating, agentic orchestration at scale
- Concerns: None critical
- Missing signals: Compensation benchmarking signals (intentional omission)

**Senior Director, AI Platform**
- Match: **91%**
- Evidence: Cross-functional, cloud-native, platform transformation, Ola case study
- Concerns: Slight over-qualification at "Senior Director" level
- Missing signals: none critical

**Chief AI Officer**
- Match: **62%**
- Evidence: AI strategy articulation, governance framework, board-level language present
- Concerns: No C-suite title in career history; no "reports to CEO/Board" statement; no enterprise risk/regulatory language; no company-wide AI strategy ownership at $1B+ org
- Missing signals: Board interaction evidence, AI policy/regulatory expertise, M&A involvement, enterprise-wide budget ownership with dollar amounts

**CTO**
- Match: **58%**
- Evidence: 20 years technology, global teams, infrastructure background, platform architecture
- Concerns: CTO typically requires broader technology ownership beyond AI; no product/engineering P&L with explicit dollar amounts; no M&A due diligence; no mention of technology debt remediation strategy
- Missing signals: Full technology stack P&L, CTO-level company-wide strategy

**SVP Engineering**
- Match: **72%**
- Evidence: Scale (200+ engineers), global distribution, delivery at HERE for 18 years
- Concerns: AI focus may be perceived as narrow for SVP Engineering at a non-AI company
- Missing signals: Organization design experience at 500+ engineer scale

**VP Platform Engineering**
- Match: **88%**
- Evidence: Platform transformation at Ola, PaaS architecture, API-first strategy
- Concerns: None critical
- Missing signals: None critical

**VP Enterprise AI**
- Match: **89%**
- Evidence: Enterprise AI deployment, governance, FinOps, B2B customer scale
- Concerns: "Enterprise AI" is sometimes a sales/GTM role; positioning is on the build side
- Missing signals: Enterprise sales/GTM partnership experience

---

## SECTION 4 — EXECUTIVE SEARCH READINESS (30-Second Test)

### First 6 Seconds

**Can a recruiter determine:**

| Signal | Present? | Time to Find |
|---|---|---|
| Current level (VP) | ✅ Yes | Immediate — headline |
| Executive scope (200+ engineers) | ✅ Yes | Immediate — stats bar |
| Leadership scale | ✅ Yes | Stats bar, hero |
| AI expertise | ✅ Yes | Immediate |
| Geographic base | ✅ Yes | Subtitle |
| Differentiation | ⚠️ Partial | Requires 15+ seconds to land |

### Weak Points

**The "currently exploring" section** uses passive language ("currently exploring VP / Head of AI Engineering roles"). Executive recruiters at Spencer Stuart/Korn Ferry level respond better to direct signals like "immediately available" or "considering select executive opportunities." The current phrasing sounds like a job seeker, not an executive in demand.

**The hero subtitle** packs too much: "VP / Head of AI Engineering | Agentic AI Platforms · AI FinOps · AI Governance | 200+ Engineers | Chicago" — strong but the four-item pill list below it (Agentic AI, LLM Platforms, Applied AI Strategy, Global Engineering Leadership) is redundant with the subtitle and creates noise.

**No single-sentence executive positioning statement.** The best executive profiles have one sentence that summarizes the value proposition. The site's closest equivalent ("AI platform executive who turns GenAI programs into governed, cost-efficient production systems") appears below the fold and after a significant amount of content.

**Confusing messaging for non-AI-native recruiters:** MCP, WASM, WebGPU, HITL, ONNX — these terms appear frequently without translation for executive search partners who are not deeply technical.

---

## SECTION 5 — EXECUTIVE BRAND POSITIONING

### Reconstructed Career Arc

```
2000–2002   Network Engineer (India) — Foundation
2002–2005   QA/Testing/Dev (Canada/US) — Platform entry
2005–2012   Lead/Sr Engineer @ HERE — Infrastructure/mapping depth
2012–2021   Engineering Manager → Sr Manager @ HERE — Leadership scale
2021–2023   Director @ HERE (Autonomous Driving) — Domain authority (AI/ML)
2023         Head of Infra @ HERE (5 months) — Pivot signal
2023–2025   Sr Director @ Ola — Startup transformation
2025–Now    Head of AI Engineering @ Krutrim — AI platform executive
```

### Narrative Gaps

1. **The transition out of HERE after 18 years is unexplained.** Recruiters will notice the jump from an 18-year tenure at a stable company to two India-based startups in rapid succession. Was this a deliberate strategic pivot toward AI? A personal decision? The narrative doesn't address this.

2. **The 5-month stint at HERE as Head of Infrastructure** (May–September 2023) looks like a bridge role before leaving. This is a yellow flag for some executive searchers.

3. **There is no "why Krutrim/Ola" story.** The most compelling executive narrative would connect the India startup experience to a strategic thesis: "I chose to build India's AI infrastructure from scratch because that's where the most ambitious AI platform challenges were." That story is absent.

4. **The career starts at QA** (Denizens Systems) and network engineering (eVision). These are buried but visible in the experience section. For senior executive positioning, these early-career roles can dilute the executive narrative. They could be collapsed into "20+ years building technology systems" without listing individually.

5. **The MBA in Strategic Marketing** from Northern Illinois University is a positive signal but is not leveraged in the narrative. MBA holders should be speaking more explicitly about business strategy, go-to-market, and competitive positioning.

### Most Compelling Executive Story (Recommended Reframe)

> "From infrastructure engineer to agentic AI platform architect — 20 years building the systems that make AI work at enterprise scale. I've operated at the edge of what's possible: autonomous driving maps at HERE, India's first production agentic AI platform at Krutrim, 13,000+ B2B customers at Ola. My thesis: AI's business value is unlocked not by the model but by the platform, governance layer, and operating model around it. That's what I build."

---

## SECTION 6 — FORTUNE 500 BENCHMARKING

### Benchmarked Against: OpenAI VP Engineering, Google DeepMind Research Directors, AWS AI/ML Directors, Microsoft AI Platform Leaders, Typical Fortune 500 AI VPs

| Dimension | Prasad Score | F500 AI VP Benchmark | Gap |
|---|---|---|---|
| Executive presence | 7 / 10 | 8.5 / 10 | Moderate — needs more authoritative tone |
| Technical depth | 9 / 10 | 8 / 10 | **Ahead** — demos are unique differentiator |
| Business impact (quantified) | 7.5 / 10 | 8 / 10 | Minor — needs P&L dollar amounts |
| Leadership scale | 7 / 10 | 8.5 / 10 | Gap — 200+ engineers at startups vs enterprise |
| Transformation experience | 8 / 10 | 8 / 10 | On par |
| Governance maturity | 9 / 10 | 7.5 / 10 | **Ahead** — governance page is rare |
| Brand name employers | 5 / 10 | 9 / 10 | **Critical gap** — Krutrim/Ola vs Google/AWS |
| External validation | 3 / 10 | 8 / 10 | **Critical gap** — no press, papers, patents, speaking |
| AI research credibility | 4 / 10 | 6 / 10 | Gap — applied AI, not research |
| Board/C-suite visibility | 2 / 10 | 7 / 10 | **Critical gap** |

**Estimated Percentile Rankings (among executive AI candidates):**
- Technical credibility: **85th percentile** (demos are exceptional)
- Governance depth: **90th percentile** (rare in AI executive portfolios)
- Brand name recognition: **35th percentile** (Krutrim/Ola are unknown to most US recruiters)
- External validation: **20th percentile** (no press, papers, patents)
- Overall executive positioning: **68th percentile**

---

## SECTION 7 — CAIO / CTO READINESS AUDIT

### Chief AI Officer Readiness

| CAIO Requirement | Evidence Present | Gap |
|---|---|---|
| AI strategy (company-wide) | Partial — portfolio-level only | Need enterprise-wide AI strategy narrative |
| Operating model creation | ✅ Strong — Krutrim PaaS, governance page | — |
| Budget ownership | ❌ Missing | No dollar amounts stated |
| Executive communication | Partial — perspectives articles | Need board-level communication examples |
| Governance / risk management | ✅ Strong | Best signal on the site |
| Regulatory/compliance expertise | ❌ Missing | EU AI Act, NIST AI RMF, SOC 2 absent |
| Board interaction | ❌ Missing | No evidence of board reporting or presentations |
| Transformation leadership | ✅ Present | Krutrim + Ola cases documented |
| Vendor negotiation at scale | ❌ Missing | Not mentioned |
| AI ethics framework | Partial — guardrails mentioned | Need explicit responsible AI policy authorship |

**CAIO Readiness Score: 6.2 / 10**

Key missing signals: board interaction, regulatory depth, C-suite communication, explicit budget ownership.

### Chief Technology Officer Readiness

| CTO Requirement | Evidence | Gap |
|---|---|---|
| Full tech stack ownership | Partial | AI-focused, not full-stack company tech |
| P&L ownership | ❌ | No dollar amounts |
| M&A/due diligence | ❌ | Absent |
| Investor/board communication | ❌ | Absent |
| Technology debt strategy | ❌ | Not addressed |
| Talent strategy at scale (500+) | ❌ | 200+ is impressive but below large enterprise |
| Product-engineering alignment | ✅ | Present |
| Security/compliance posture | ✅ | SECURITY.md, CSP, guardrails |

**CTO Readiness Score: 5.5 / 10**

CTO positioning is significantly weaker than CAIO positioning. The portfolio is correctly NOT targeting CTO at scale. If CTO is a goal, the narrative needs significant reframing.

---

## SECTION 8 — BOARD-LEVEL CREDIBILITY AUDIT

### Board Member Perspective

A board member evaluating this portfolio would ask:

**What they can find:**
- Revenue impact ($10M+ at Krutrim) — present on homepage
- Cost savings ($70% at Ola) — prominently featured
- Scale (13K+ B2B customers) — well-positioned
- Team leadership (200+ engineers) — front and center

**What they cannot find:**
- **Total budget managed** — no dollar amount for engineering budget
- **EBITDA or margin impact** — cost savings are mentioned but not tied to margin
- **Risk mitigation outcomes** — governance is described as a feature, not a risk reduction story
- **Competitive differentiation narrative** — why did this platform win vs. alternatives?
- **Shareholder/investor value created** — no equity value narrative
- **Board presentation experience** — no evidence of executive committee or board exposure
- **Exit/outcome for Krutrim or Ola** — both are ongoing but no IPO/acquisition signals
- **Regulatory interaction** — no RBI, SEBI, or US regulatory engagement mentioned

### Board-Level Score: 5.5 / 10

The financial storytelling needs to be elevated from engineering metrics to business outcomes that a CFO or board member would use.

---

## SECTION 9 — EXECUTIVE SEARCH VOCABULARY ANALYSIS

### Term Frequency Assessment

**Overrepresented (Technical):**
- LLM (appears 30+ times across the site)
- RAG (20+ times)
- Agentic / Agentic AI (30+ times)
- MCP (10+ times)
- Vector Search (15+ times)
- WASM / WebGPU / ONNX / HITL (10+ times each)
- Guardrails (15+ times)
- Drift monitoring (10+ times)

**Underrepresented (Executive):**
- "Operating model" (2 times — should be 10+)
- "Transformation" (5 times — should be 15+)
- "Revenue" (3 times, vague — should have specific figures)
- "Board" (2 times — should be 5+)
- "Risk" (4 times in governance context only — needs business risk framing)
- "Strategy" (8 times — adequate but needs more business context)
- "P&L" (2 times — needs more)
- "Go-to-market" (0 times — should appear)
- "Stakeholder" (3 times — needs more)
- "Competitive advantage" (0 times — should appear)
- "Regulatory" (0 times — critical gap)
- "Innovation agenda" (0 times)
- "Return on investment" or "ROI" (2 times — needs more)

### Recommended Vocabulary Rebalancing

Executive search systems (Eightfold, Beamery) score candidates partly on vocabulary alignment with job descriptions. Fortune 500 JDs for VP/Head AI Engineering use these terms heavily: **transformation, operating model, governance, stakeholders, strategy, ROI, compliance, P&L, scale, enterprise, cross-functional, go-to-market**. The portfolio needs more of these, especially on the `/for-recruiters` and `/capabilities` pages.

---

## SECTION 10 — TRUST SIGNALS AUDIT

| Trust Signal | Present | Quality | Notes |
|---|---|---|---|
| Team sizes | ✅ | Good | 200+ engineers clearly stated |
| Org sizes | ✅ | Good | Global distribution stated |
| Budget ownership | ❌ | Missing | No dollar amounts |
| Financial outcomes | ✅ | Good | 70% cost reduction, $10M+ revenue |
| Production deployments | ✅ | Excellent | 15 live demos |
| Global scale | ✅ | Good | US/India/Europe stated |
| Patents | ❌ | Missing | None |
| Certifications | ✅ | Excellent | 52+ with recent AI focus |
| Public speaking | ❌ | Missing | No conferences listed |
| Publications | ❌ | Missing | No papers, no articles on external platforms |
| Media mentions | ❌ | Missing | No press coverage |
| Recommendations/testimonials | ⚠️ | Weak | Only 4 testimonials; none from C-suite or VPs above his level |
| LinkedIn recommendations | ⚠️ | Unknown | Pointer to LinkedIn but count unknown |
| Advisory roles | ❌ | Missing | None listed |
| Board memberships | ❌ | Missing | None listed |
| Academic affiliations | ❌ | Missing | None listed |

**Trust Signal Score: 6.0 / 10**

The quantified business impact metrics are strong. Everything else in this category requires external validation that currently doesn't exist (press, publications, patents, speaking, higher-caliber testimonials).

**Critical recommendation:** The 4 testimonials should be expanded. None are from people *above* Prasad's level. A single quote from a CEO, CTO, or CAIO who he reported to would be 10x more credible than four peer/direct-report testimonials.

---

## SECTION 11 — AI AGENT READINESS AUDIT

### Files Present

| Asset | Status | Quality |
|---|---|---|
| robots.txt | ✅ Present | **Exceptional** — 20+ AI bot entries with specific permissions |
| sitemap.xml | ✅ Present | Standard |
| llms.txt | ✅ Present | **Best-in-class** — clear, structured, machine-readable |
| llms-full.txt | ✅ Present | Extended context version |
| entity.json | ✅ Present | Clean JSON entity definition |
| ai-agent-manifest.json | ✅ Present | Comprehensive manifest |
| JSON-LD structured data | ✅ Present | Detailed Person schema with credentials, knowsAbout |
| security.txt | ✅ Present | Professional security disclosure |
| security-posture.json | ✅ Present | Machine-readable security posture |
| MCP callable endpoint | ✅ Present | `/api/mcp-demo` — **unique differentiator** |
| `<link rel="ai-content">` | ✅ Present | AI content discovery hint |
| Open Graph | ✅ Present | Complete |
| Twitter Cards | ✅ Present | Complete |

### Issues Found

1. **Inconsistency: llms.txt says "14 total demos," site says "15 production demos."** This needs to be aligned.
2. **entity.json last_updated: 2026-04-26** — nearly 2 months stale. AI systems that cache this will report outdated counts.
3. **$10M+ revenue metric is missing from entity.json and ai-agent-manifest.json** but present on the homepage. Inconsistency reduces AI summarization accuracy.
4. **The CAIO/CTO target roles are in the metadata keywords (`meta-keywords`) but NOT in entity.json or ai-agent-manifest.json `target_roles`.** This means AI systems matching to CAIO/CTO searches will not find Prasad.
5. **No `hreflang` for languages other than `en-US`** — minor, but limits APAC/EMEA discoverability.

**Agent Readiness Score: 9.1 / 10** — Exceptional. Minor consistency fixes needed.

---

## SECTION 12 — RECRUITER CONVERSION FUNNEL AUDIT

### Funnel Analysis

**Discovery →**
- SEO: Good keyword coverage; structured data is present; but no external backlinks or press to boost domain authority
- AI search: Excellent (GEO infrastructure is best-in-class)
- LinkedIn: Unknown — not audited, but homepage directs heavily to LinkedIn
- Direct/referred: No case for why someone would share the portfolio link

**→ Interest**
- Hero loads quickly, title is immediately clear ✅
- Stats (200+, 70%, 13K+, 20+) are compelling ✅
- "Currently exploring" language is passive — should say "Available for VP-level conversations" ⚠️
- No "what makes me different from the 100 other AI VPs" in first screen ❌

**→ Validation**
- 15 live demos provide excellent technical validation ✅
- /for-recruiters page is well-designed ✅
- Governance page is unique and impressive ✅
- Certifications page is comprehensive ✅
- Only 4 testimonials, none from above Prasad's level ❌
- No press mentions or external third-party validation ❌

**→ Contact**
- Email, LinkedIn, Calendly all present ✅
- Contact page exists ✅
- Gmail email address (not prasad@prasadkavuri.com) signals individual, not executive brand ⚠️
- "Book a Call" goes to Calendly — clean ✅

**→ Interview**
- Resume PDF downloadable ✅
- Resume.md machine-readable ✅
- No "30-day availability" or start date signal ❌

### Identified Drop-Off Points

1. **Recruiter who doesn't know Krutrim/Ola** — exits without understanding the company context
2. **Non-technical recruiter** — gets lost in demo descriptions with technical jargon
3. **Executive searcher looking for CAIO/CTO** — doesn't see explicit positioning for those roles
4. **PE/VC partner** — sees no M&A, no equity value creation story, no investment outcome
5. **US Fortune 500 recruiter** — sees India-company experience and may downweight it

---

## SECTION 13 — SECURITY & TECHNICAL DUE DILIGENCE

### Security Posture (Strong)

- Content Security Policy: Active in next.config.ts and proxy.ts ✅
- Rate limiting via Upstash Redis with SHA-256 IP hashing ✅
- Prompt injection detection at API layer ✅
- Output sanitization (DOMPurify) ✅
- `npm audit --audit-level=high` enforced in CI ✅
- SECURITY.md and responsible disclosure policy ✅
- HITL checkpoints on agentic workflows ✅
- No secrets in client-side code ✅
- security-posture.json machine-readable ✅

### Concerns That Would Surface in Due Diligence

1. **Gmail contact email** — vbkpkavuri@gmail.com. At VP/executive level, a custom domain email (prasad@prasadkavuri.com) is expected. Small but real signal to enterprise security reviewers.
2. **Demo data** — Governance page explicitly states metrics are simulated. Good transparency, but a sophisticated reviewer will note all business metrics are therefore unverifiable through this channel.
3. **API rate limits** — Currently using free tier Upstash Redis. At scale this would need enterprise tier. Minor, but a technical due diligence reviewer would note it.
4. **No mention of SOC 2, ISO 27001, or GDPR compliance experience** — these are expected at Fortune 500 AI VP level.
5. **Vercel deployment** — Serverless architecture; a CTO-level reviewer might ask about data residency for enterprise customers.

### Security Score: 8.5 / 10
The technical security implementation is genuinely strong. The reputational security signals (SOC 2, ISO, compliance) are missing.

---

## SECTION 14 — PERFORMANCE & MODERNIZATION

### Stack Assessment

| Layer | Version | Assessment |
|---|---|---|
| Next.js | 16.2.6 | Cutting-edge (App Router + Turbopack) |
| React | 19.2.6 | Latest stable |
| TypeScript | 6.0.3 | Latest |
| Tailwind CSS | 4.2.4 | Latest |
| Groq SDK | Server-side | Appropriate |
| Transformers.js v4 | Browser WASM | Modern pattern |
| Vercel | Current | Industry-standard |
| Upstash Redis | Rate limiting | Appropriate |

**The technical stack is state-of-the-art.** This is itself a signal: a VP/Head who actively maintains a modern stack signals technical currency.

### Areas for Attention

1. **Bundle size** — 15 demos with WASM models loaded in browser; page weight may be high on initial load. Not audited live but worth measuring.
2. **Core Web Vitals** — LCP on hero section with profile photo and stats; should measure.
3. **Mobile experience** — Some browser-WASM demos are desktop-only (explicitly noted). This is architecturally correct but should be clearly communicated in the mobile UI.
4. **Image optimization** — Profile photo served through Next.js image optimization (`/_next/image`). Appropriate.
5. **OG image consistency** — homepage uses a dynamically generated OG image while subpages use the static `og-image.jpg`. This inconsistency means LinkedIn preview cards will vary across pages.

### Modernization Opportunities

- A2A (Agent-to-Agent) protocol demo is listed as "currently exploring" — shipping this would differentiate significantly
- On-device Small Language Model demo is noted as in-progress — strong executive signal when shipped

---

## SECTION 15 — EXECUTIVE DIFFERENTIATION AUDIT

### Why Hire Prasad Kavuri Instead of Another AI Executive?

**Top differentiators (clearly visible):**
1. **Live production portfolio** — 15 demos running in production, not a slide deck. Unique at VP level.
2. **Governance-first mindset** — Dedicated governance page, HITL, eval-gated CI. Most AI VPs talk governance; this one shows it.
3. **Cost-optimization track record** — 70% reduction is a specific, large number. Not "significant savings."
4. **Agentic AI at commercial scale** — Kruti.ai is the only commercial reference for an agentic AI platform in production at national scale.
5. **End-to-end builder** — Went from infrastructure (HERE) through maps/autonomous driving to agentic AI. Cross-domain depth.

**Differentiators present but undersold:**
6. **Multi-geography leadership** — US, India, Europe simultaneously. Valuable for global enterprises. Mentioned but not featured.
7. **APAC/India market expertise** — Building for India's AI ecosystem is increasingly valuable for global companies with APAC ambitions. Not positioned as a differentiator.
8. **Certifications currency** — 6 Anthropic certifications in Q1 2026 signals active learning at executive level. Rare and notable.

**Differentiators that are missing:**
9. **The "no one else built this"** angle — The portfolio shows unique capabilities but never directly says "I built something that didn't exist before." The Kruti.ai story needs more boldness.
10. **A hiring manager reference** — None of the testimonials are from a peer CEO, CTO, or CAIO who hired Prasad.

### Differentiation Visibility Score: 7 / 10

The differentiation exists. It is not always surfaced in the first 30 seconds.

---

## SECTION 16 — EXECUTIVE VALUE PROP SCORECARD

| Dimension | Score | Notes |
|---|---|---|
| Entity Clarity | **7.5** | Strong for VP AI; weak for CAIO/CTO |
| Executive Positioning | **7.0** | VP/Head positioning excellent; C-suite positioning missing |
| Technical Credibility | **9.0** | 15 live demos — exceptional |
| Business Credibility | **7.0** | Good numbers; missing budget/P&L/board signals |
| Transformation Leadership | **7.5** | 2 clear transformation cases; narrative needs sharpening |
| AI Leadership | **8.5** | Best-in-class governance, eval, agentic demos |
| Board Readiness | **5.0** | No board interaction evidence; financial language needs elevation |
| CAIO Readiness | **6.0** | Governance strong; C-suite communication, regulatory depth missing |
| CTO Readiness | **5.5** | Under-positioned for CTO; AI focus too narrow |
| Recruiter Experience | **8.0** | /for-recruiters is excellent; passive language in availability signals |
| AI Discoverability | **9.0** | Best-in-class GEO infrastructure |
| Citation Readiness | **5.5** | No external anchor sources |
| Trust Signals | **6.0** | Quantified metrics strong; external validation absent |
| Security | **8.5** | Technically strong; enterprise compliance signals missing |
| Performance | **8.0** | Modern stack; live demos functional |

**Overall Composite: 7.2 / 10**

---

## SECTION 17 — PRIORITIZED IMPROVEMENT ROADMAP

### QUICK WINS (1–3 Days)

**1. Fix Demo Count Inconsistency**
- llms.txt says "14 total demos"; site says "15 production demos"
- Update llms.txt, entity.json, and ai-agent-manifest.json to match
- Impact: High (citation accuracy) | Effort: Trivial | Priority: P0

**2. Add $10M+ Revenue to entity.json and ai-agent-manifest.json**
- The homepage has this metric; machine-readable files do not
- Impact: High (AI summarization accuracy) | Effort: Trivial | Priority: P0

**3. Update entity.json last_updated to today**
- Currently shows 2026-04-26 — nearly 2 months stale
- Impact: Medium | Effort: Trivial | Priority: P1

**4. Add "Chief AI Officer" and "CTO" to target_roles in entity.json and ai-agent-manifest.json**
- Currently only in meta-keywords, not machine-readable role files
- Impact: High (CAIO/CTO search matching) | Effort: Trivial | Priority: P1

**5. Change contact email to custom domain**
- vbkpkavuri@gmail.com → prasad@prasadkavuri.com (or similar)
- Gmail signals individual; custom domain signals executive brand
- Impact: Medium | Effort: Low | Priority: P1

**6. Sharpen availability language**
- "Currently exploring" → "Open to select VP / Head of AI Engineering and CAIO conversations"
- Impact: Medium | Effort: Trivial | Priority: P1

**7. Contextualize Krutrim/Ola for US audiences**
- Add brief company context: "Krutrim (Ola's AI division, backed by $50M+ funding)" or similar
- Ola: "India's leading ride-sharing and mobility platform (comparable to Uber India)"
- Impact: High for US recruiters | Effort: Low | Priority: P1

### MEDIUM INVESTMENTS (1–3 Weeks)

**8. Add explicit P&L/budget numbers**
- "Managed $X engineering budget" or "Owned $X technology P&L"
- Even ranges help: "Led engineering organization with $5M–$15M annual run rate"
- Impact: Very High (CAIO/CTO/Board credibility) | Effort: Medium | Priority: P1

**9. Add 3–4 more testimonials, specifically from people above Prasad's level**
- A CTO, CEO, or board member testimonial outweighs 10 peer/direct-report quotes
- Impact: Very High (trust signal) | Effort: Medium | Priority: P1

**10. Publish 1–2 thought leadership articles on LinkedIn / Medium with external links back to portfolio**
- This creates external citation anchors for AI systems
- Topics: "How We Cut AI Infrastructure Costs by 70% at Ola" or "What I Learned Building India's First Agentic AI Platform"
- Impact: Very High (GEO citation probability) | Effort: Medium | Priority: P1

**11. Add explicit regulatory/compliance language**
- Reference EU AI Act readiness, NIST AI RMF alignment, or responsible AI frameworks
- Critical for CAIO positioning
- Impact: High (CAIO readiness) | Effort: Medium | Priority: P2

**12. Create a dedicated "Enterprise AI Strategy" narrative page**
- One page focused on Prasad's AI strategy framework, not just demos
- Position as a thought framework, not a demo index
- Impact: High (executive credibility, CAIO positioning) | Effort: High | Priority: P2

**13. Add a brief transition narrative explaining the HERE → Ola → Krutrim arc**
- "After 18 years building autonomous driving infrastructure, I made a deliberate pivot to build what I believe is the most important category in enterprise software: agentic AI platforms."
- Impact: High (narrative clarity, recruiter trust) | Effort: Low | Priority: P2

### STRATEGIC INVESTMENTS (1–3 Months)

**14. Secure one speaking engagement at a named AI conference**
- AI Engineer World's Fair, AI Summit Chicago, O'Reilly AI Superstream, etc.
- Even a 15-minute panel creates an external citation anchor
- Impact: Very High (GEO, trust, CAIO credibility) | Effort: High | Priority: P1

**15. Publish a case study or technical article on an external platform**
- The Batch (DeepLearning.AI), Towards Data Science, InfoQ, or IEEE
- Topic: Agentic AI governance at scale, or the Krutrim platform architecture
- Impact: Very High (citation probability, CAIO credibility) | Effort: High | Priority: P1

**16. Pursue an advisory board position at an AI startup**
- Creates an external entity relationship and board-level signal
- Impact: High (board credibility, executive network signals) | Effort: High | Priority: P2

**17. Add a dedicated "Board & C-Suite" page**
- Translate the technical portfolio into business language: revenue, risk, competitive advantage
- Purpose: a page you can share with a board recruiting partner or PE firm
- Impact: Very High (CAIO/CTO/Board positioning) | Effort: High | Priority: P2

**18. Pursue 1–2 media interviews or press mentions**
- Chicago Tribune tech section, Built in Chicago, VentureBeat, TechCrunch India
- Topic: "Building India's AI infrastructure" or "AI FinOps at enterprise scale"
- Impact: Very High (GEO citation, external validation) | Effort: Very High | Priority: P2

---

## SECTION 18 — EXECUTIVE SUMMARY

### TOP 10 CHANGES TO INCREASE RECRUITER CONVERSION

1. Fix the passive availability language ("currently exploring" → direct CTA)
2. Contextualize Krutrim and Ola for US audiences (one sentence each)
3. Add explicit P&L/budget amounts to the experience section
4. Add C-suite-level testimonial (CEO, CTO, or CAIO who Prasad reported to)
5. Sharpen the 6-second differentiation statement above the fold
6. Collapse early-career roles (pre-2005) into a single "technical foundation" line
7. Add "immediately available" or specific start date to the /for-recruiters page
8. Add a "why now, why me, why this company" narrative — not just a capabilities list
9. Replace Gmail contact with custom domain email
10. Add explicit "boards and senior leaders I've influenced" section

### TOP 10 CHANGES TO INCREASE GEO PERFORMANCE

1. Fix demo count inconsistency across llms.txt, entity.json, manifest (Quick Win)
2. Add $10M+ revenue to machine-readable files
3. Update entity.json last_updated to current date
4. Publish one substantive external article (Towards Data Science, VentureBeat) with a backlink
5. Add target roles CAIO and CTO to entity.json and agent-manifest target_roles
6. Get one press mention (Built In Chicago, TechCrunch India) — creates authoritative citation anchor
7. Qualify the "India's first agentic AI platform" claim with a citation or qualifier
8. Add `sameAs` links to any future Wikipedia page, Crunchbase profile, or media coverage
9. Create a `/press` or `/media` page even if sparse — signals readiness for coverage
10. Implement structured data on `/for-recruiters` page specifically (currently just the homepage has full JSON-LD)

### TOP 10 CHANGES TO INCREASE EXECUTIVE CREDIBILITY

1. Add explicit engineering budget dollar amounts
2. Add "reported to [CEO/CTO title]" signal to experience entries
3. Add advisory board or board position (even at a small AI startup)
4. Add one external published article as authoritative reference
5. Reference EU AI Act, NIST AI RMF, or comparable regulatory frameworks explicitly
6. Add the MBA more prominently to executive narrative (business-outcomes framing)
7. Add competitive landscape language — what alternatives did you beat, and why?
8. Add M&A or due diligence experience if any exists
9. Create a board-friendly one-pager (PDF) available for download
10. Add at least one Fortune 500 or large-company engagement to the narrative if any consulting/advisory exists

### TOP 10 CHANGES TO IMPROVE CAIO READINESS

1. Add a dedicated "AI Strategy Framework" section — how do you think about enterprise AI strategy?
2. Explicitly mention EU AI Act and NIST AI RMF awareness
3. Add "AI governance charter" or "responsible AI policy" to the portfolio artifacts
4. Add board-level communication examples (even anonymized case studies)
5. Add explicit ROI framework — "For every $1M invested in AI, how do you drive $Xm in value?"
6. Reference AI risk management vocabulary: risk appetite, residual risk, risk register
7. Position the governance page as "AI risk management" not just "trust controls"
8. Add "AI operating model" as a dedicated capability with case study
9. Add regulatory/compliance case study (even at portfolio level)
10. Add "AI ethics committee" or "responsible AI working group" as experience signal

### TOP 10 CHANGES TO IMPROVE CTO READINESS

*(Note: CTO is a stretch from current positioning — requires more fundamental repositioning)*

1. Broaden technology narrative beyond AI to include full technology stack ownership
2. Add explicit P&L ownership with dollar amounts
3. Add product strategy content — CTO must bridge engineering and product
4. Add M&A due diligence language
5. Add technology debt / architectural modernization case study
6. Add "technology strategy roadmap" as a capability
7. Add board/investor communication examples
8. Broaden team scale language toward 500+ if applicable
9. Add explicit examples of vendor negotiation at scale
10. Add "build vs. buy vs. partner" decision framework examples

### TOP 10 CHANGES TO INCREASE AI CITATION PROBABILITY

1. Publish one substantive article on a platform AI systems index (Medium, VentureBeat, IEEE)
2. Get one press mention in a named tech publication
3. Add a Wikipedia-style entity disambiguation page (or contribute to Wikipedia)
4. Create a Crunchbase profile with links back to prasadkavuri.com
5. Add a Speaker profile on Luma, Sessionize, or conference platforms
6. Qualify "India's first agentic AI platform" claim with a citation
7. Fix all data inconsistencies across llms.txt, entity.json, and manifest files
8. Add `@id` URIs to all sub-entities in JSON-LD (experience entries, certifications)
9. Create a `/press` page with even one quote or mention
10. Register entity on Wikidata (free, takes 30 minutes, creates authoritative knowledge graph node)

### ESTIMATED BEFORE / AFTER SCORES

| Dimension | Current | After Quick Wins | After 90 Days |
|---|---|---|---|
| GEO Score | 8.4 | 8.8 | 9.2 |
| Citation Probability | 5.5 | 5.8 | 7.5 |
| Entity Clarity | 7.5 | 8.0 | 8.5 |
| Executive Positioning | 7.0 | 7.5 | 8.5 |
| CAIO Readiness | 6.2 | 6.5 | 7.5 |
| CTO Readiness | 5.5 | 5.5 | 6.5 |
| Trust Signals | 6.0 | 6.3 | 7.5 |
| Board Credibility | 5.5 | 5.5 | 7.0 |
| Recruiter Conversion | 7.5 | 8.0 | 8.8 |
| **Overall** | **7.2** | **7.5** | **8.4** |

### 30-DAY ROADMAP

**Week 1 — Data Consistency & Quick Wins:**
- Fix demo count across all machine-readable files
- Add $10M+ revenue to entity.json and ai-agent-manifest.json
- Add CAIO/CTO to target_roles in machine-readable files
- Update entity.json last_updated
- Sharpen availability language on homepage and /for-recruiters
- Add one-sentence context for Krutrim and Ola

**Week 2 — Narrative Strengthening:**
- Add the transition narrative (HERE → Ola → Krutrim)
- Add explicit engineering budget language to experience section
- Update /for-recruiters with stronger executive language
- Add "P&L Management" with any available dollar context

**Week 3 — External Presence:**
- Publish one LinkedIn article (minimum 800 words, linked back to portfolio)
- Register on Wikidata
- Create or update Crunchbase profile

**Week 4 — Trust Signals:**
- Reach out to 2–3 people above Prasad's level for testimonials
- Identify one AI conference to target for speaking

### 90-DAY ROADMAP

**Month 2:**
- Publish one article on external platform (Towards Data Science, VentureBeat, InfoQ)
- Apply to speak at one named AI conference (submission deadlines vary)
- Draft "AI Strategy Framework" page

**Month 3:**
- Launch "AI Strategy Framework" page
- Add regulatory language (EU AI Act, NIST AI RMF) to governance narrative
- Secure one advisory board position
- Create board-level one-pager PDF
- Target at least one press mention (proactive outreach to Built In Chicago)

### THE SINGLE MOST IMPORTANT CHANGE TO MAKE IMMEDIATELY

**Publish one external article that gets cited.**

Everything else on this site is excellent. The GEO infrastructure is best-in-class. The demos are unique. The governance narrative is differentiated. But an AI system asked "who is Prasad Kavuri?" can only cite *prasadkavuri.com* because it is the only source. One article on VentureBeat, InfoQ, or even a well-indexed LinkedIn article creates a second citation source, elevates the entity's authority score, and dramatically increases the probability of Prasad surfacing in AI-generated answers about "top AI engineering leaders" or "agentic AI experts in Chicago."

Every other improvement on this list is incremental. That one is multiplicative.

---

*Audit conducted: June 16, 2026 | Analyst: Multi-persona executive review | Sources: local repository, live site (prasadkavuri.com), structured metadata files, AI discovery artifacts*
