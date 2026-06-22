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

## Flagged ambiguities

- "demo" alone is ambiguous — it can mean the page (`/demos/rag-pipeline`), the data object (`demos[n]`), or the live running experience. Prefer **module card** for the UI element, **demo entry** for the data object, and **demo page** for the route.
- "featured" is overloaded: the signature demo is "featured" in DemosGallery; the top 4 Experience entries are "featured roles". Use the specific terms.
- "layer" in AIArchitecture and "layer" in Tailwind/CSS are different things. Context resolves which is meant.
