# Prasad Kavuri — VP / Head of AI Engineering Portfolio

> **Live at [prasadkavuri.com](https://www.prasadkavuri.com)**  
> Production-grade AI engineering portfolio with 10 production demos,
> enterprise security, full governance layer, and CI/CD pipeline.

[![CI](https://github.com/prasad-kavuri/prasad-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/prasad-kavuri/prasad-portfolio/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-387%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-100%25%20lib-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black)]()
[![React](https://img.shields.io/badge/React-19.2.5-blue)]()

## Live Demos

| Demo | Category | Tech Stack | Mode |
|---|---|---|---|
| [RAG Pipeline](https://www.prasadkavuri.com/demos/rag-pipeline) | Core AI | Transformers.js, all-MiniLM-L6-v2 | Browser |
| [Vector Search](https://www.prasadkavuri.com/demos/vector-search) | Core AI | Transformers.js, PCA, Canvas | Browser |
| [LLM Router](https://www.prasadkavuri.com/demos/llm-router) | Core AI | Groq, Llama 3.1/4, Qwen3 | Server |
| [AI Evaluation Showcase](https://www.prasadkavuri.com/demos/evaluation-showcase) | Core AI | LLM-as-Judge, eval-engine, drift-monitor | Server |
| [AI Portfolio Assistant](https://www.prasadkavuri.com/demos/portfolio-assistant) | Applications | Groq, full-context grounding, retrieval cues, streaming | Server |
| [Resume Generator](https://www.prasadkavuri.com/demos/resume-generator) | Applications | Groq, Llama 3.3 70B, PDF export | Server |
| [Multimodal Assistant](https://www.prasadkavuri.com/demos/multimodal) | Applications | Florence-2, WebGPU, Transformers.js | Browser |
| [Model Quantization](https://www.prasadkavuri.com/demos/quantization) | Applications | ONNX, FP32 vs INT8 benchmark | Browser |
| [Multi-Agent System](https://www.prasadkavuri.com/demos/multi-agent) | Agentic | Groq, Analyzer+Researcher+Strategist, HITL | Server |
| [MCP Tool Demo](https://www.prasadkavuri.com/demos/mcp-demo) | Agentic | MCP protocol, Groq tool calling | Server |

## Architecture Overview

![Portfolio AI system architecture](public/architecture-diagram.svg)

The portfolio is modeled as a production AI system rather than a static site:

| Layer | Implementation |
|---|---|
| UI Layer | Next.js App Router, Tailwind CSS, Framer Motion, Vercel Analytics |
| API and Reliability | Shared route utilities for request tracing, validation, rate limits, errors, and structured logs |
| Agentic Orchestration | Multi-agent workflow demo, HITL checkpoint, MCP tool discovery, prompt safety, and approval-oriented patterns |
| Governance | Guardrails (injection detection, competitor filtering, hallucination heuristics), eval engine, drift monitor, cost control |
| AI Services | LLM Router, RAG Pipeline, full-context Portfolio Assistant, Resume Generator, Evaluation Showcase, MCP Demo, browser ML demos |
| Data Layer | `profile.json`, `demos.ts`, browser embeddings, vector search, static knowledge base |
| External Services | Groq, Hugging Face models/Spaces, Upstash Redis, Vercel hosting and telemetry |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system-level breakdown, including routing, security, and observability.

```
prasad-portfolio/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Main portfolio page
│   │   ├── layout.tsx                    # Root layout, metadata, JSON-LD
│   │   ├── status/                       # System status dashboard
│   │   ├── governance/                   # Governance dashboard (metrics, audit log)
│   │   ├── demos/                        # 10 demo pages
│   │   └── api/                          # Server-side API routes
│   │       ├── llm-router/               # Multi-model routing
│   │       ├── portfolio-assistant/      # Full-context assistant + retrieval grounding
│   │       ├── resume-generator/         # JD parsing + PDF
│   │       ├── multi-agent/              # Agent orchestration + HITL
│   │       ├── mcp-demo/                 # MCP tool calling
│   │       ├── evaluation-showcase/      # Eval pipeline API
│   │       └── resume-download/          # PDF download
│   ├── components/
│   │   ├── sections/                     # Hero, AITools, Experience, etc.
│   │   └── ui/                           # shadcn/ui components
│   ├── data/
│   │   ├── profile.json                  # Single source of truth
│   │   └── demos.ts                      # Demo card definitions
│   └── lib/
│       ├── rate-limit.ts                 # Upstash rate limiting + IP hashing
│       ├── observability.ts              # Structured logging, anomaly detection, trace propagation
│       ├── guardrails.ts                 # Injection detection, competitor filter, hallucination heuristics
│       ├── eval-engine.ts                # LLM-as-Judge scoring, offline/online eval cases
│       ├── drift-monitor.ts              # Model output drift detection
│       ├── cost-control.ts               # Per-route token cost tracking
│       ├── hitl.ts                       # Human-in-the-loop checkpoint utilities
│       ├── analytics.ts                  # Usage event tracking
│       └── api.ts                        # Shared route utilities
├── src/__tests__/
│   ├── api/                              # API route unit tests (incl. resume-download)
│   ├── components/                       # Component tests
│   ├── evals/                            # LLM accuracy eval tests
│   ├── fuzz/                             # Adversarial/fuzz tests
│   ├── integration/                      # Cross-cutting integration tests
│   ├── lib/                              # Library unit tests (incl. drift-monitor)
│   ├── resilience/                       # Chaos + failure chain tests
│   └── stateful/                         # Sequence + rate limit tests
├── e2e/                                  # Playwright E2E tests
├── docs/
│   └── ARCHITECTURE.md                  # Full system architecture + patentable patterns
├── .github/
│   ├── workflows/ci.yml                  # Parallel CI pipeline
│   └── dependabot.yml                    # Automated dependency updates
└── public/
    ├── robots.txt                        # SEO + crawler config
    ├── llms.txt                          # AI crawler hint file
    └── .well-known/
        ├── security.txt                  # Security contact + disclosure policy
        └── ai-agent-manifest.json        # Machine-readable profile
```

## Security

| Control | Implementation | Status |
|---|---|---|
| Content Security Policy | `next.config.ts` + `src/proxy.ts` headers | Active |
| Rate Limiting | Upstash Redis (@upstash/ratelimit), 10 req/60s per IP | Active |
| Prompt Injection Guard | `src/lib/guardrails.ts` canonical signatures via `detectPromptInjection` / `isPromptInjection` | Active |
| Competitor Mention Filter | Redacts 8 competitor names from LLM output | Active |
| Hallucination Heuristic | Key-fact presence check on long outputs | Active |
| XSS Sanitization | DOMPurify on all LLM output | Active |
| Input Validation | Length limits + type checks at route entry | Active |
| SSRF Protection | `src/lib/url-security.ts` blocks internal/private, loopback, link-local, encoded-IP, and credentialed targets | Active |
| IP Hashing | SHA-256 before Redis storage, never raw IPs | Active |
| HITL Checkpoint | Human approval before Strategist runs (multi-agent) | Active |
| Eval Regression Gate | CI blocks if fidelity < 0.85 or hallucination > 0.10 | Active |
| Dependency Scanning | `npm audit --audit-level=high` in CI + Dependabot | Active |
| COOP/COEP Headers | Required for SharedArrayBuffer / WASM multi-threading | Active |
| No Hardcoded Secrets | All keys via `process.env`, verified in security tests | Active |
| Security Disclosure | `public/.well-known/security.txt` with contact + policy | Active |

## Testing

```bash
npm run test           # unit tests (Vitest) — 387 passing, 35 test files
npm run test:coverage  # coverage report
npm run test:fuzz      # adversarial/fuzz tests
npm run test:evals     # LLM-as-Judge eval suite
npm run test:e2e       # Playwright (chromium, firefox, webkit, mobile)
```

| Layer | Directory | Focus |
|---|---|---|
| API Routes | `src/__tests__/api/` | Handler logic, validation, error states |
| Components | `src/__tests__/components/` | Rendering, interaction, accessibility |
| Library | `src/__tests__/lib/` | Rate limiting, observability, guardrails, drift, eval engine |
| LLM Evals | `src/__tests__/evals/` | Guardrail accuracy, injection detection, hallucination scoring |
| Fuzz | `src/__tests__/fuzz/` | Adversarial inputs, edge cases |
| Stateful | `src/__tests__/stateful/` | Sequence tests, rate limit drain |
| Resilience | `src/__tests__/resilience/` | Chaos, timeouts, failure chains |
| Integration | `src/__tests__/integration/` | Metadata, security config integrity |
| E2E | `e2e/` | Cross-browser, WCAG 2.1 AA, performance |

Coverage gates enforced in CI: API routes ≥90% statements / ≥85% branches, lib ≥95% functions (currently 100%).

## CI/CD Pipeline

Two-job parallel pipeline on every push to `main` and every PR:

```
lint-and-unit (security audit → lint → unit tests + coverage gates)
     └─► e2e matrix
              ├── chromium
              ├── firefox
              ├── webkit
              └── mobile
```

- `npm audit --audit-level=high` blocks on any high/critical CVEs
- Dependabot: weekly dependency updates, major versions require manual review
- Playwright report uploaded as artifact on failure (7-day retention)

## Tech Stack

**Framework:** Next.js 16.2.3 (App Router + Turbopack), React 19.2.5  
**Styling:** Tailwind CSS v4, shadcn/ui, Framer Motion 12  
**AI/ML:** @huggingface/transformers v4 (WASM/WebGPU), Groq SDK  
**Security:** @upstash/ratelimit, @upstash/redis, DOMPurify  
**Testing:** Vitest 4, Playwright 1.59, @axe-core/playwright  
**Observability:** @vercel/analytics, @vercel/speed-insights, structured JSON logging  
**Deployment:** Vercel (edge middleware, CDN)

## Local Development

```bash
git clone https://github.com/prasad-kavuri/prasad-portfolio.git
cd prasad-portfolio
npm install

# Copy and fill environment variables
cp .env.local.example .env.local

npm run dev   # http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API — console.groq.com |
| `UPSTASH_REDIS_REST_URL` | Yes | Rate limiting (in-memory fallback in dev) |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Rate limiting |
| `ANTHROPIC_API_KEY` | Optional | Future use |
| `NEXT_PUBLIC_APP_URL` | Optional | Defaults to http://localhost:3000 |

Browser demos (RAG, Vector Search, Multimodal, Quantization) run 100%
client-side via WebAssembly — no API key required.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — 6-layer system design + patentable patterns
- [System Status](https://www.prasadkavuri.com/status) — Mixed telemetry from centralized snapshot data (`src/data/telemetry-snapshots.ts`), including all 10 production systems
- [Governance](https://www.prasadkavuri.com/governance) — Mixed telemetry governance dashboard with centralized snapshot metrics, policy controls, audit records, and explicit snapshot timestamps

## 2026 Production AI Patterns Now Live

This portfolio ships production-grade implementations of the patterns that define enterprise AI in 2026:

### Guardrails Layer (`src/lib/guardrails.ts`)
- Canonical guardrails module used by API routes for prompt-injection checks and output sanitization
- Prompt injection detection signatures including template injection and instruction override
- Competitor mention detection and redaction — 8 competitor names, applied to all LLM output
- Hallucination heuristics — confidence scoring on long outputs with key-fact presence check
- Agent handoff validation — `validateAgentHandoff` guards every inter-agent transition
- Single entry point: `enforceGuardrails(input, output, traceId?)` → `GuardrailResult`

### Closed-Loop Evaluation Pipeline (`src/lib/eval-engine.ts` + `src/lib/drift-monitor.ts`)
- **LLM-as-Judge** scoring — semantic fidelity, required coverage terms, forbidden topic detection
- Offline batch evals + online live-traffic sampling via drift monitor
- Regression gating in CI — PRs blocked if fidelity < 0.85 or hallucination rate > 0.10
- Interactive demo at [/demos/evaluation-showcase](https://www.prasadkavuri.com/demos/evaluation-showcase)

### Human-in-the-Loop Checkpoint (`src/lib/hitl.ts`)
- Mandatory approval step between Researcher and Strategist agents
- Visual HITL badge in the multi-agent demo UI — on by default
- Demonstrates the enterprise pattern: autonomous agents pause for human review before consequential actions

### End-to-End Trace Propagation (`src/lib/observability.ts`)
- `generateClientTraceId()` — client generates UUID v4 at interaction start
- `createTracedFetch(traceId)` — injects `X-Trace-Id` / `X-Request-Id` on every request
- Server reads via `createRequestContext()` → same ID flows through all logs and LLM calls

### Governance Dashboard (`/governance`)
- Deterministic snapshot-driven safety metrics from `src/data/telemetry-snapshots.ts` with optional `/api/eval-snapshot` live overlays
- Policy controls inventory with implementation file references
- Audit event log — CFO/CTO/CISO framing for enterprise buyers

### Why It Matters
Most AI portfolios show prompts and demos. This one ships the **governance, evaluation, safety infrastructure, and observability** that production AI systems actually require — and all of it is in the test suite and CI pipeline, not just documentation.

## License

MIT — © 2026 Prasad Kavuri
