# prasad-portfolio

Production AI engineering portfolio at https://www.prasadkavuri.com.
Stack: Next.js 16 App Router · React 19 · TypeScript 6 · Tailwind 4 · Groq SDK · Vercel.

## Language

**browser demo**:
A demo that runs inference entirely in the browser — no server API call for the AI work. Uses WASM (Transformers.js, ONNX Runtime) or WebGPU (Florence-2). Must use the `useBrowserAI` hook.
_Avoid_: "client-side demo", "WASM demo" (only correct for WASM subset)

**server demo**:
A demo where inference runs on a Vercel serverless function, calling the Groq API. No ML code runs in the browser.
_Avoid_: "backend demo", "API demo"

**layer**:
One of the 14 stages in the AIArchitecture platform execution flow (User Intent → Business Outcome). Each has an id, num (01-14), name, tagline, category, detail, tech chips, and portfolio example.
_Avoid_: "step", "stage", "node"

**signature demo**:
The `evaluation-showcase` demo — always rendered as a featured card at the top of DemosGallery, with a branded border and "Signature System" badge. One and only one signature demo exists.
_Avoid_: "flagship demo", "featured demo" (though "flagship" appears in copy)

**module card**:
A demo card in DemosGallery. Shows icon, title, exec-model badge, Live status, businessImpact (accent color), description, optional "What this proves" callout, and tech tags.
_Avoid_: "demo card", "card component"

**exec model**:
The execution environment badge on a module card — one of: `Browser WASM`, `Server API`, `WebGPU`, `Browser ONNX`, `On-Device AI`, `Edge + Cloud`, `Three.js + API`.
_Avoid_: "runtime label", "execution badge"

**platform stat**:
One of the 4 stats in the DemosGallery header strip: Governance layer, Rate limiting, Eval gating, Audit trail.
_Avoid_: "header stat", "infra stat"

**featured role**:
One of the 4 outcome-led experience entries in the Experience section: `krutrim`, `ola`, `here-head`, `here-director`. Each has a Situation + What I Built + Outcomes grid.
_Avoid_: "highlighted role", "key role"

**compact strip**:
The earlier HERE Technologies roles rendered below the featured roles in the Experience section — no outcome narrative, just title / company / tags / period inline.
_Avoid_: "earlier roles section", "additional roles"

**outcome narrative**:
The three-part structure inside a featured role card: The Situation → What I Built → Outcomes (metric grid).
_Avoid_: "story section", "impact narrative"

**profile fact**:
A value exported from `PORTFOLIO_FACTS` in `src/data/site-config.ts`. Single source of truth for counts and headline numbers used across the site (e.g. `productionDemoCount`, `engineersLed`).
_Avoid_: "constant", "metric constant"

**accent brand**:
The primary interactive color: CSS variable `var(--accent-brand)` = `oklch(0.5 0.24 264)`. Used for interactive highlights, CTA backgrounds, and emphasis text. Always applied via inline style or CSS variable — never Tailwind arbitrary value.
_Avoid_: "brand color", "primary color"

**HITL gate**:
A human-in-the-loop checkpoint — a point in an agent pipeline where execution pauses and waits for explicit human approval before continuing. Implemented via `src/lib/hitl.ts`.
_Avoid_: "approval step", "human checkpoint"

**browser AI warning**:
The `BrowserAIWarning` component — shown on mobile/low-memory devices when a browser demo cannot run. All 4 browser demos must render this.
_Avoid_: "mobile warning", "WASM fallback banner"

**recruiter path**:
The intended recruiter review flow: `/for-recruiters` → `/recruiter-dashboard` → `/capabilities` → `/governance` → `/demos/evaluation-showcase` → book call.
_Avoid_: "recruiter journey", "evaluation path"

**demo group**:
A named cluster of demos in DemosGallery: `core` (Core AI Infrastructure), `agentic` (Agentic Systems), or `apps` (AI Applications). Defined in the `GROUPS` const.
_Avoid_: "demo category", "demo section"

**agent context**:
The `<AgentContext />` component — renders hidden SEO/AI-crawler metadata on the homepage. Not visible to users.
_Avoid_: "hidden metadata", "SEO component"

**observability event**:
A structured log entry emitted by `logAPIEvent()` in `src/lib/observability.ts`. Carries trace ID, route, latency, token counts, and anomaly score.
_Avoid_: "log entry", "API log"

**guardrail check**:
A call to `enforceGuardrails()` or `checkInput()` from `src/lib/guardrails.ts`. Required at the entry point of every API route.
_Avoid_: "safety check", "input check"

## Relationships

- A **browser demo** must use the **useBrowserAI** hook and the **browser AI warning** component.
- A **server demo** must call `enforceRateLimit`, `enforceGuardrails`, `startTimer`, and `logAPIEvent` in its route handler.
- Every demo has exactly one **exec model** badge and belongs to exactly one **demo group**.
- The **signature demo** (`evaluation-showcase`) always renders outside any **demo group** grid, above all groups.
- A **featured role** always has an **outcome narrative**; a **compact strip** role never does.
- **Profile facts** are the single source of truth — never hardcode a count or metric that has a matching `PORTFOLIO_FACTS` key.

**spatial demo**:
A browser demo that uses Three.js or WebGL for 3D / spatial visualization alongside an API call — e.g. Vector Search. Exec model: `Three.js + API`.
_Avoid_: "3D demo", "WebGL demo"

**mcp-demo**:
The `/demos/mcp-demo` page demonstrating the Model Context Protocol with Groq tool-calling. Server demo — no browser ML.
_Avoid_: "MCP page", "tools demo"

**multi-agent-demo**:
The `/demos/multi-agent` page — three Groq agents (Analyzer, Researcher, Strategist) coordinated in sequence with a HITL gate. Server demo.
_Avoid_: "multi-agent page", "agent pipeline demo"

**governance-demo**:
The `/governance` special page and its live `/api/enterprise-sim` feed — shows observability charts, cost control, audit trail, and drift monitoring.
_Avoid_: "governance page" (use this term but with the understanding it is a full demo, not just marketing)

**evaluation-demo**:
The `/demos/evaluation-showcase` signature demo — LLM-as-Judge eval suite, regression CI gate, scorecard UI. This is the signature demo.
_Avoid_: "eval demo", "judging demo"

**finops-demo**:
The `/demos/enterprise-control-plane` demo — simulates a multi-team Anthropic API cost/usage control plane with deterministic seeded data.
_Avoid_: "cost demo", "enterprise demo"

**control-plane-demo**:
Synonym for **finops-demo** (`/demos/enterprise-control-plane`). Prefer `finops-demo` in code comments; use `control-plane-demo` in documentation and copy.

**recruiter experience**:
The curated path from recruiter landing → capabilities → governance → signature demo → contact — optimized for a hiring manager who has 5 minutes. Starts at `/for-recruiters`.
_Avoid_: "recruiter flow", "candidate path"

**executive summary**:
The above-the-fold profile section (Hero) plus the AIArchitecture 14-layer section together — the two sections a VP or CTO sees first.
_Avoid_: "hero section" (too narrow), "summary section"

**leadership timeline**:
The Experience section rewritten as a vertical timeline with featured roles and compact strip. The section heading text in the UI.
_Avoid_: "experience section" (use when referring to the React component), "career timeline"

**krutrim**:
Ola Electric's AI division where Prasad built the 300-seat, 50%-CSAT-lift call center AI platform. Context: first major AI leadership role, $10M+ revenue attributable. Founded 2023, Bengaluru.
_Avoid_: "Krutrim AI" (full name in copy), abbreviating as "K"

**ola**:
Ola Electric (OLA brand) — Prasad built the AI recommendation engine for 35M+ users, 13 languages, 70% support deflection. Different from Krutrim (Krutrim is a subsidiary).
_Avoid_: "Ola Electric" and "Ola" used interchangeably — prefer "Ola Electric" in copy, "ola" in code keys

**here**:
HERE Technologies (maps/location intelligence) — two roles: `here-head` (Head of AI Engineering, managed 40 engineers) and `here-director` (Director AI Engineering). Compact strip roles below them.
_Avoid_: "HERE Maps" (outdated name), just "here" in isolation without clarifying head vs. director

**anthropic-style**:
Design and communication pattern inspired by Anthropic: detailed technical prose, safety emphasis, honest uncertainty, long-form explanation. Referenced in executive-review skill personas.
_Avoid_: "Anthropic aesthetic"

**stripe-style**:
Design and communication pattern inspired by Stripe: pixel-precise, dense technical docs, trust signals everywhere, developer-first. Referenced in recruiter-review and executive-review skills.
_Avoid_: "Stripe aesthetic"

**vercel-style**:
Design pattern inspired by Vercel: minimal, fast, dark mode first, monospace accents, deployment-focused. Applies to this portfolio's visual identity.
_Avoid_: "Vercel theme"

**llms-txt**:
The `/public/llms.txt` file — plain-text portfolio summary for LLM crawlers (ChatGPT, Claude, Gemini, Perplexity). Part of the agentic SEO system.
_Avoid_: "llm text file", "crawler file"

**agentic-seo**:
The collection of AI-crawler discoverability assets: `llms.txt`, `llms-full.txt`, `ai-agent-manifest.json`, JSON-LD `@graph`, `sitemap.xml`, speakable spec, and the recruiter query phrases in llms.txt.
_Avoid_: "AI SEO", "LLM SEO"

**playwright**:
The E2E test framework — `e2e/*.spec.ts`. Runs across chromium/firefox/webkit and mobile viewports. Separate from Vitest unit tests.
_Avoid_: "E2E tests" (too generic when Playwright is the tool)

**semgrep**:
Static analysis tool used in the security-review skill to scan for OWASP patterns, SSRF vectors, and injection risks. Not currently in CI — recommended addition.
_Avoid_: "static analysis", "SAST tool"

**gitleaks**:
Secret scanning tool (checks for leaked API keys, tokens) used in the security-review skill.
_Avoid_: "secret scanner"

**vitest**:
The unit test runner — `src/__tests__/**/*.test.tsx`. Uses happy-dom environment. Not to be confused with Playwright.
_Avoid_: "unit tests" (too generic when Vitest is the tool)

**storybook**:
Component development and documentation tool — not yet installed, referenced in the redesign-portfolio skill as a recommended addition.
_Avoid_: using it as if it is currently live (it is not)

## Relationships

- A **browser demo** must use the **useBrowserAI** hook and the **browser AI warning** component.
- A **server demo** must call `enforceRateLimit`, `enforceGuardrails`, `startTimer`, and `logAPIEvent` in its route handler.
- Every demo has exactly one **exec model** badge and belongs to exactly one **demo group**.
- The **signature demo** (`evaluation-showcase`) always renders outside any **demo group** grid, above all groups.
- A **featured role** always has an **outcome narrative**; a **compact strip** role never does.
- **Profile facts** are the single source of truth — never hardcode a count or metric that has a matching `PORTFOLIO_FACTS` key.
- **krutrim**, **ola**, and **here** map directly to the `OUTCOMES` record keys in `Experience.tsx`.
- **llms-txt** + `ai-agent-manifest.json` + JSON-LD `@graph` together form the **agentic-seo** system.
- **playwright** tests are E2E; **vitest** tests are unit/integration. Both must pass before every commit.

## Flagged ambiguities

- "demo" alone is ambiguous — it can mean the page (`/demos/rag-pipeline`), the data object (`demos[n]`), or the live running experience. Prefer **module card** for the UI element, **demo entry** for the data object, and **demo page** for the route.
- "featured" is overloaded: the signature demo is "featured" in DemosGallery; the top 4 Experience entries are "featured roles". Use the specific terms.
- "layer" in AIArchitecture and "layer" in Tailwind/CSS are different things. Context resolves which is meant.
- "governance" refers to both the `/governance` page and the platform governance practices generally. Distinguish with **governance-demo** vs. "governance principles".
- **storybook** is aspirational (not installed) — do not treat it as available unless a PR explicitly adds it.
