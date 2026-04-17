# Prasad Kavuri — AI Engineering Portfolio

> Production-grade AI platform | [prasadkavuri.com](https://www.prasadkavuri.com)

Production-grade AI engineering portfolio for VP / Head / Sr Director evaluation. The site demonstrates how agentic AI systems are designed, governed, and operated beyond prototype stage.

## What This Portfolio Demonstrates

- **AI Evaluation Showcase (Signature System)**: closed-loop quality architecture with offline evals, semantic fidelity scoring, hallucination checks, drift monitoring, and release gating.
- **Multi-Agent System (Flagship Workflow)**: Analyzer → Researcher → Strategist orchestration with explicit human approval before strategic output release.
- **LLM Router**: model routing with latency/cost/quality trade-off framing for FinOps-aware inference decisions.
- **RAG + Vector Search**: browser-executed retrieval patterns using Transformers.js embeddings for local-first knowledge workflows.
- **Governance and Control Plane**: guardrails, RBAC signals, traceability, token-spend visibility, and enterprise trust controls with a dynamic drift detect → remediate → stabilize simulation.
- **MCP Tool Demo**: dynamic tool discovery/invocation pattern for auditable model-to-tool interaction.
- **Applied AI Experiences**: portfolio assistant, resume generator, multimodal inference, and quantization benchmarks.
- **Spatial World Generation**: governed text-to-3D world generation with real browser-rendered procedural 3D preview, GLB export, and adapter-based provider fallback (`hyworld` contract + deterministic mock output).

## Architecture Overview

```mermaid
graph TD
  A[prasadkavuri.com] --> B[/governance Dashboard]
  A --> C[/demos — 13 Live Demos]

  C --> D[Control Plane & Evaluation]
  C --> E[Agent Orchestration]
  C --> F[Multimodal & Retrieval]
  C --> G[Infrastructure & Tooling]

  D --> D1[AI Evaluation Showcase]
  D --> D2[LLM Router]
  E --> E1[Multi-Agent Orchestration]
  E --> E2[MCP Demo]
  F --> F1[RAG Pipeline]
  F --> F2[Vector Search]
  F --> F3[Multimodal Assistant]
  G --> G1[Model Quantization]
  G --> G2[Portfolio Assistant]
  G --> G3[Resume Generator]

  subgraph "Shared Platform Layer — src/lib/"
    H[guardrails.ts]
    I[observability.ts — Trace-ID propagation]
    J[eval-engine.ts]
    K[drift-monitor.ts]
    L[rate-limit.ts]
  end

  C --> H
  C --> I
  C --> J
  C --> K
  C --> L
```

Every demo is served by the same shared governance infrastructure — guardrails, observability, drift monitoring, and evaluation gating are platform-level concerns, not per-demo implementations.

Canonical diagram asset: `public/architecture-diagram.svg` · Live: https://www.prasadkavuri.com/#architecture

## Demo Catalog — 13 Live Demos

| Demo | Category | Key Pattern | Business Relevance |
|---|---|---|---|
| AI Evaluation Showcase | Control Plane & Evaluation | LLM-as-Judge, semantic fidelity scoring, CI eval gating | Prevents regression leakage; stops quality degradations before production |
| LLM Router | Control Plane & Evaluation | Multi-model routing, latency/cost/quality trade-offs | 40–70% cost reduction through route-to-fit inference |
| Enterprise Control Plane | Control Plane & Evaluation | RBAC, token-spend analytics, OpenTelemetry event feed | Org-wide AI governance: access control, spend accountability, audit trails |
| Multi-Agent System | Agent Orchestration | CrewAI, HITL approval checkpoint, specialist roles | Faster cross-functional decisions with controlled autonomy |
| MCP Tool Demo | Agent Orchestration | Model Context Protocol, dynamic tool discovery | Reliable, auditable tool-use contracts at scale |
| RAG Pipeline | Multimodal & Retrieval | Transformers.js embeddings, ChromaDB, browser execution | Higher answer precision with lower support escalation |
| Vector Search | Multimodal & Retrieval | sentence-BERT, UMAP visualization, cosine retrieval | Accelerates knowledge discovery across large content repositories |
| Multimodal Assistant | Multimodal & Retrieval | Florence-2, WebGPU, in-browser OCR/captioning | Lower vision pipeline cost with local-first execution |
| Model Quantization | Infrastructure & Tooling | ONNX benchmarking, INT8 vs FP32, Transformers.js | Quantifiable inference efficiency and deployment economics |
| AI Portfolio Assistant | Infrastructure & Tooling | Vercel AI SDK streaming, retrieval-grounded context | Shortens stakeholder time-to-context for key decisions |
| Resume Generator | Infrastructure & Tooling | Structured generation, skill matching, schema.org JSON-LD | Reduces recruiting cycle time through candidate-role alignment |
| Native Browser AI Skill | Infrastructure & Tooling | Chrome Prompt API, Gemini Nano, WASM | Zero-latency, 100% private on-device inference |
| AI Spatial Intelligence & World Generation | Infrastructure & Tooling | Three.js, GLB export, provider adapter, approval gating | Governed spatial planning artifacts, simulation-ready with policy controls |

## Production AI Patterns (2026)

- End-to-end Trace-ID propagation (`src/lib/observability.ts`)
- Human-in-the-Loop checkpoint — Researcher → Strategist handoff
- Closed-loop evaluation with LLM-as-Judge + CI gating
- Model drift monitoring with automated alerting
- Guardrails at infrastructure layer (not per-feature)
- Semantic rate limiting — token budget admission before upstream API call
- SSRF prevention with URL allowlist + redirect-hop validation
- WCAG 2.2 AA accessibility compliance (axe-core in CI)

## Visual Proof

Flagship workflow proof artifact (Multi-Agent execution rail + human approval checkpoint):

![Multi-Agent workflow proof artifact](./public/readme-multi-agent-workflow-proof.svg)

## Local Development

```bash
# Prerequisites: Node 18+, npm 9+
npm install
npm run dev          # http://localhost:3000
npm run test         # unit + integration
npm run test:e2e     # Playwright (requires built server: npm run build first)
npm run build        # production build
npm audit --audit-level=high  # security gate
```

## Tech Stack

Next.js 16.2.3 / React 19 · TypeScript · Tailwind CSS v4 ·
Vercel (hosting) · Upstash Redis (rate limiting) ·
Groq (LLM inference) · Transformers.js (browser WASM inference) ·
Playwright (E2E) · Vitest (unit)

## Testing and Quality Gates

```bash
npm run test              # unit + integration (468 tests, 37 files)
npm run test:coverage     # coverage gates: API ≥90% stmts, lib ≥95% functions
npm run test:fuzz         # adversarial input tests
npm run test:evals        # LLM-as-Judge eval suite
npm run test:e2e          # Playwright: chromium, firefox, webkit, mobile
```

Coverage gates: API routes ≥90% statements / ≥85% branches; lib ≥95% functions.

## About

Built by Prasad Kavuri — AI Engineering Leader with 20+ years scaling production AI platforms at Krutrim, Ola, and HERE Technologies. Open to VP / Head of AI Engineering roles in the Chicago area and beyond.
