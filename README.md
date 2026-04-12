# Prasad Kavuri — VP / Head of AI Engineering Portfolio

> **Live at [prasadkavuri.com](https://www.prasadkavuri.com)**  
> Production-grade AI engineering portfolio with 9 live demos,
> enterprise security, full test suite, and CI/CD pipeline.

[![CI](https://github.com/prasad-kavuri/prasad-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/prasad-kavuri/prasad-portfolio/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-270%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black)]()
[![React](https://img.shields.io/badge/React-19.2.5-blue)]()

## Live Demos

| Demo | Category | Tech Stack | Mode |
|---|---|---|---|
| [RAG Pipeline](https://www.prasadkavuri.com/demos/rag-pipeline) | Core AI | Transformers.js, all-MiniLM-L6-v2 | Browser |
| [Vector Search](https://www.prasadkavuri.com/demos/vector-search) | Core AI | Transformers.js, PCA, Canvas | Browser |
| [LLM Router](https://www.prasadkavuri.com/demos/llm-router) | Core AI | Groq, Llama 3.1/4, Qwen3 | Server |
| [AI Portfolio Assistant](https://www.prasadkavuri.com/demos/portfolio-assistant) | Applications | Groq, RAG, streaming | Server |
| [Resume Generator](https://www.prasadkavuri.com/demos/resume-generator) | Applications | Groq, Llama 3.3 70B, PDF export | Server |
| [Multimodal Assistant](https://www.prasadkavuri.com/demos/multimodal) | Applications | Florence-2, WebGPU, Transformers.js | Browser |
| [Model Quantization](https://www.prasadkavuri.com/demos/quantization) | Applications | ONNX, FP32 vs INT8 benchmark | Browser |
| [Multi-Agent System](https://www.prasadkavuri.com/demos/multi-agent) | Agentic | Groq, Analyzer+Researcher+Strategist | Server |
| [MCP Tool Demo](https://www.prasadkavuri.com/demos/mcp-demo) | Agentic | MCP protocol, Groq tool calling | Server |

## Architecture Overview

![Portfolio AI system architecture](public/architecture-diagram.svg)

The portfolio is modeled as a production AI system rather than a static site:

| Layer | Implementation |
|---|---|
| UI Layer | Next.js App Router, Tailwind CSS, Framer Motion, Vercel Analytics |
| API and Reliability | Shared route utilities for request tracing, validation, rate limits, errors, and structured logs |
| Agentic Orchestration | Multi-agent workflow demo, MCP tool discovery, prompt safety, and approval-oriented patterns |
| AI Services | LLM Router, RAG Pipeline, Portfolio Assistant, Resume Generator, MCP Demo, browser ML demos |
| Data Layer | `profile.json`, `demos.ts`, browser embeddings, vector search, static knowledge base |
| External Services | Groq, Hugging Face models/Spaces, Upstash Redis, Vercel hosting and telemetry |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system-level breakdown, including routing, security, and observability.

```
prasad-portfolio/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Main portfolio page
│   │   ├── layout.tsx                # Root layout, metadata, JSON-LD
│   │   ├── demos/                    # 9 demo pages
│   │   └── api/                      # Server-side API routes
│   │       ├── llm-router/           # Multi-model routing
│   │       ├── portfolio-assistant/  # RAG + streaming
│   │       ├── resume-generator/     # JD parsing + PDF
│   │       ├── multi-agent/          # Agent orchestration
│   │       ├── mcp-demo/             # MCP tool calling
│   │       └── resume-download/      # PDF download
│   ├── components/
│   │   ├── sections/                 # Hero, AITools, Experience, etc.
│   │   └── ui/                       # shadcn/ui components
│   ├── data/
│   │   ├── profile.json              # Single source of truth
│   │   └── demos.ts                  # Demo card definitions
│   └── lib/
│       ├── rate-limit.ts             # Upstash rate limiting + IP hashing
│       ├── observability.ts          # Structured logging + anomaly detection
│       ├── analytics.ts              # Usage event tracking
│       └── api.ts                    # Shared route utilities
├── src/__tests__/
│   ├── api/                          # API route unit tests
│   ├── components/                   # Component tests
│   ├── evals/                        # LLM accuracy eval tests
│   ├── fuzz/                         # Adversarial/fuzz tests
│   ├── integration/                  # Cross-cutting integration tests
│   ├── lib/                          # Library unit tests
│   ├── resilience/                   # Chaos + failure chain tests
│   └── stateful/                     # Sequence + rate limit tests
├── e2e/                              # Playwright E2E tests
├── docs/
│   └── ARCHITECTURE.md              # Full system architecture
├── .github/
│   ├── workflows/ci.yml              # Parallel CI pipeline
│   └── dependabot.yml                # Automated dependency updates
└── public/
    ├── robots.txt                    # SEO + crawler config
    ├── llms.txt                      # AI crawler hint file
    └── .well-known/
        └── ai-agent-manifest.json    # Machine-readable profile
```

## Security

| Control | Implementation | Status |
|---|---|---|
| Content Security Policy | `next.config.ts` + `src/proxy.ts` headers | Active |
| Rate Limiting | Upstash Redis (@upstash/ratelimit) | Active |
| Prompt Injection Guard | `detectPromptInjection` on all user inputs | Active |
| XSS Sanitization | DOMPurify on all LLM output | Active |
| Input Validation | Length limits + type checks at route entry | Active |
| Dependency Scanning | `npm audit --audit-level=high` in CI + Dependabot | Active |
| COOP/COEP Headers | Required for SharedArrayBuffer / WASM multi-threading | Active |
| IP Hashing | SHA-256 before Redis storage, never raw IPs | Active |
| No Hardcoded Secrets | All keys via `process.env`, verified in security tests | Active |

## Testing

```bash
npm run test           # unit tests (Vitest)
npm run test:coverage  # coverage report
npm run test:fuzz      # adversarial/fuzz tests
npm run test:e2e       # Playwright (chromium, firefox, webkit)
```

| Layer | Directory | Focus |
|---|---|---|
| API Routes | `src/__tests__/api/` | Handler logic, validation, error states |
| Components | `src/__tests__/components/` | Rendering, interaction, accessibility |
| Library | `src/__tests__/lib/` | Rate limiting, observability, analytics |
| LLM Evals | `src/__tests__/evals/` | Prompt construction, injection guards |
| Fuzz | `src/__tests__/fuzz/` | Adversarial inputs, edge cases |
| Stateful | `src/__tests__/stateful/` | Sequence tests, rate limit drain |
| Resilience | `src/__tests__/resilience/` | Chaos, timeouts, failure chains |
| Integration | `src/__tests__/integration/` | Metadata, security config integrity |
| E2E | `e2e/` | Cross-browser, WCAG 2.1 AA, performance |

Coverage gates enforced in CI: API routes ≥90%, lib ≥95%, components ≥70%.

## CI/CD Pipeline

Two-job parallel pipeline on every push to `main` and every PR:

```
lint-and-unit (security audit → lint → unit tests)
     └─► e2e matrix
              ├── chromium
              ├── firefox
              └── webkit
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

- [Architecture](docs/ARCHITECTURE.md) — 6-layer system design
- [System Status](https://www.prasadkavuri.com/status) — Live dashboard

## License

MIT — © 2026 Prasad Kavuri
