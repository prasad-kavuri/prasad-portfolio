# Prasad Kavuri — AI Engineering Portfolio

Live site: https://www.prasadkavuri.com

Production-grade AI engineering portfolio for VP / Head / Sr Director evaluation. The site demonstrates how agentic AI systems are designed, governed, and operated beyond prototype stage.

## What This Portfolio Demonstrates

- **AI Evaluation Showcase (Signature System)**: closed-loop quality architecture with offline evals, semantic fidelity scoring, hallucination checks, drift monitoring, and release gating.
- **Multi-Agent System (Flagship Workflow)**: Analyzer → Researcher → Strategist orchestration with explicit human approval before strategic output release.
- **LLM Router**: model routing with latency/cost/quality trade-off framing for FinOps-aware inference decisions.
- **RAG + Vector Search**: browser-executed retrieval patterns using Transformers.js embeddings for local-first knowledge workflows.
- **Governance and Control Plane**: guardrails, RBAC signals, traceability, token-spend visibility, and enterprise trust controls.
- **MCP Tool Demo**: dynamic tool discovery/invocation pattern for auditable model-to-tool interaction.
- **Applied AI Experiences**: portfolio assistant, resume generator, multimodal inference, and quantization benchmarks.

## Live Demos (12 Production Demos)

| Demo | Category | Tech Stack | Business Impact |
|---|---|---|---|
| AI Evaluation Showcase | Flagship Quality System | LLM-as-Judge, drift monitor, CI eval gating | Prevents regression risk before release |
| Enterprise Control Plane | Flagship Governance | RBAC, token analytics, OpenTelemetry | Enables governed AI operations with audit-ready controls |
| Multi-Agent System | Flagship Agentic Workflow | CrewAI, Groq, HITL checkpoint | Improves decision velocity with controlled autonomy |
| LLM Router | Core AI Infrastructure | Groq, multi-model orchestration, routing logic | Optimizes inference cost/latency tradeoffs |
| RAG Pipeline | Core AI Infrastructure | Transformers.js, ChromaDB, browser embeddings | Improves knowledge precision with lower support load |
| Vector Search | Core AI Infrastructure | sentence-BERT, UMAP, cosine similarity | Accelerates semantic retrieval across enterprise content |
| Browser-Native AI Skill | Browser-Native AI | On-device analysis, accessibility checks, agent-readiness scoring | Catches UX/automation risks early without data egress |
| MCP Tool Demo | Agentic Systems | MCP pattern, Groq tool use | Standardizes tool execution with traceable handoffs |
| AI Portfolio Assistant | AI Applications | Vercel AI SDK, streaming, retrieval cues | Reduces time-to-context for stakeholders |
| Resume Generator | AI Applications | Structured generation, skill matching, PDF export | Speeds candidate-role alignment workflows |
| Multimodal Assistant | Local-First AI | Florence-2, WebGPU, Transformers.js | Runs vision tasks locally for privacy/cost efficiency |
| Model Quantization | Local-First AI | ONNX, INT8 vs FP32 benchmark | Demonstrates model efficiency gains for deployment economics |

## Visual Proof

Flagship workflow proof artifact (Multi-Agent execution rail + human approval checkpoint):

![Multi-Agent workflow proof artifact](./public/readme-multi-agent-workflow-proof.svg)

## Architecture

Six-layer enterprise AI architecture:
`Users → AI Experience → Agentic Orchestration → Intelligence → Tools/Data → Business Outcomes`

Architecture section: https://www.prasadkavuri.com/#architecture
Canonical diagram asset: `public/architecture-diagram.svg`

## Trust, Governance, and Quality Posture

- Human-in-the-loop checkpoint for high-impact strategist output
- Prompt injection and output-safety guardrails in shared AI route controls
- Trace ID propagation for request-level auditability
- Drift snapshots + eval gating to reduce regression risk
- Rate limiting and abuse controls for production-safe exposure

## Stack

Next.js · TypeScript · Tailwind CSS · CrewAI · Groq · Transformers.js · ChromaDB · ONNX · OpenTelemetry · Upstash

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Testing and Quality Gates

```bash
npm test
npm run build
```

The repository includes component, API, integration, evaluation, fuzz, resilience, and Playwright coverage to keep demo behavior and trust controls reliable.

## About

Built by Prasad Kavuri — AI Engineering Leader with 20+ years scaling production AI platforms at Krutrim, Ola, and HERE Technologies. Open to VP / Head of AI Engineering roles in the Chicago area and beyond.
