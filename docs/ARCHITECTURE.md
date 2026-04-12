# Portfolio AI System Architecture

![Portfolio AI system architecture](../public/architecture-diagram.svg)

This document describes the real system architecture implemented in this repository. It keeps the website architecture section, README, and implementation-facing docs aligned around the same artifact: `public/architecture-diagram.svg`.

## System Layers

| Layer | Repo implementation | Purpose |
|---|---|---|
| UI Layer | `src/app/page.tsx`, `src/components/sections/*`, `src/data/demos.ts` | Presents the portfolio, architecture section, and 9 live demo entry points |
| API and Reliability Layer | `src/app/api/*/route.ts`, `src/lib/api.ts`, `src/lib/rate-limit.ts`, `src/lib/observability.ts` | Standardizes validation, rate limits, tracing, error responses, and structured logs |
| Agentic Orchestration Layer | `/api/multi-agent`, `/api/mcp-demo`, `src/app/demos/multi-agent`, `src/app/demos/mcp-demo` | Demonstrates agent coordination, tool discovery, specialist roles, and guarded execution patterns |
| AI Services Layer | LLM Router, RAG, AI Portfolio Assistant, Resume Generator, Multimodal, Quantization | Hosts the live AI capabilities shown on the site |
| Data Layer | `src/data/profile.json`, `src/data/demos.ts`, browser embeddings, retrieved context, static public assets | Supplies profile data, demo metadata, embeddings, and knowledge context |
| External Services | Groq, Hugging Face models/Spaces, Upstash Redis, Vercel Analytics and Speed Insights | Provides hosted inference, agent backends, distributed rate limiting, and telemetry |

## API Routes

The current API surface is:

| Route | Capability | Main implementation notes |
|---|---|---|
| `/api/llm-router` | Multi-model routing | Calls Groq models, returns latency/cost metrics, validates prompt/model input |
| `/api/portfolio-assistant` | Streaming RAG assistant | Streams Groq responses with retrieved profile context |
| `/api/resume-generator` | Resume tailoring | Parses job descriptions and returns structured resume JSON |
| `/api/multi-agent` | Multi-agent analysis | Proxies to the agent backend and validates the target website URL |
| `/api/mcp-demo` | MCP-style tool calling | Lets Groq select and execute profile tools via a JSON-RPC-like tool schema |
| `/api/resume-download` | Resume redirect | Rate-limited redirect to the public PDF asset |

All routes use the shared helpers in `src/lib/api.ts` for request context, errors, rate-limit headers, and response finalization.

## Orchestration

The orchestration layer is represented by two production-facing demos:

- `multi-agent`: models analyzer, researcher, and strategist roles, with backend execution handled through a remote agent service.
- `mcp-demo`: exposes deterministic profile tools such as experience lookup, skill search, fit scoring, and achievement retrieval.

The intent is to show the architecture pattern rather than hide it behind a single chat box: narrow agents, explicit tools, and auditable handoffs.

## Routing and AI Services

The AI services layer contains both server-side and browser-side demos:

| Demo | Path | Execution mode |
|---|---|---|
| RAG Pipeline | `/demos/rag-pipeline` | Browser embeddings and retrieval |
| Vector Search | `/demos/vector-search` | Browser embeddings and visualization |
| LLM Router | `/demos/llm-router` | Server route calling Groq |
| Multi-Agent System | `/demos/multi-agent` | Server route plus external agent backend |
| MCP Tool Demo | `/demos/mcp-demo` | Server route calling Groq tool use |
| Resume Generator | `/demos/resume-generator` | Server route calling Groq |
| AI Portfolio Assistant | `/demos/portfolio-assistant` | Server route with streaming RAG |
| Multimodal Assistant | `/demos/multimodal` | Browser model execution |
| Model Quantization | `/demos/quantization` | Browser ONNX benchmark |

The LLM Router demonstrates the cost/latency tradeoff pattern directly. RAG and vector search demonstrate retrieval before generation. Browser demos show local inference patterns that reduce server load and external API cost.

## Data Layer

The primary repo data sources are:

- `src/data/profile.json`: professional profile, experience, skills, education, and summary copy.
- `src/data/demos.ts`: demo metadata, route paths, technology tags, and business impact lines.
- Browser embeddings and vector search state in the RAG/vector demos.
- Public assets in `public/`, including `profile-photo.jpg`, `Prasad_Kavuri_Resume.pdf`, and `architecture-diagram.svg`.

There is no hidden database for the portfolio content. The repo intentionally keeps public profile data auditable and versioned.

## Security Layers

Security controls are implemented at route boundaries and platform configuration:

- `src/lib/api.ts` validates JSON bodies, standardizes error responses, adds request IDs, and finalizes responses with trace and rate-limit headers.
- `src/lib/rate-limit.ts` provides Upstash Redis sliding-window rate limiting in production with an in-memory fallback for local/test runs.
- `detectPromptInjection` blocks common prompt-injection strings before LLM calls.
- `sanitizeLLMOutput` strips script tags, event handlers, and `javascript:` URIs from LLM output.
- API routes enforce input shape and length limits before external calls.
- Middleware/proxy and Next config provide HTTP security headers such as CSP and COOP/COEP where needed.
- CI runs `npm audit --audit-level=high`, lint, unit coverage, and Playwright checks.

## Observability

The reliability layer includes lightweight observability without adding a heavy monitoring dependency:

- `createRequestContext` generates or accepts request trace IDs.
- Responses include `X-Request-Id`, `X-Trace-Id`, `Server-Timing`, and `X-RateLimit-*` headers when applicable.
- `logApiEvent`, `logApiWarning`, and `logApiError` write structured JSON logs.
- `captureAPIError` emits sanitized error monitoring events without leaking raw error messages.
- `trackAPIRequest` and `trackRateLimit` maintain in-memory counters used by tests and local diagnostics.
- `detectAnomaly` flags slow responses and 5xx responses for abnormal usage logging.

## Diagram Ownership

The canonical architecture artifact is:

```text
public/architecture-diagram.svg
```

The website renders it in `src/components/sections/Architecture.tsx`. README and this document embed the same file. If the API routes, demo list, or external services change, update the SVG and this document in the same change.
