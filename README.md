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

## Demo Inventory

### Core AI Infrastructure
- AI Evaluation Showcase
- RAG Pipeline
- LLM Router
- Vector Search

### Agentic Systems
- Multi-Agent System
- MCP Tool Demo
- Enterprise Control Plane

### AI Applications
- AI Portfolio Assistant
- Resume Generator
- Multimodal Assistant
- Model Quantization

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
