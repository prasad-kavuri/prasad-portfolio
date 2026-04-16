# Prasad Kavuri — AI Engineering Portfolio

Live site: https://www.prasadkavuri.com

## What This Is

This is a production-style AI engineering portfolio built to demonstrate real enterprise AI patterns — not a toy demo. It showcases the architectural thinking, system design, and production engineering behind the work I've done at Krutrim and Ola.

## What It Demonstrates

- **Agentic Orchestration** — Multi-agent system with Analyzer, Researcher, and Strategist agents running real LLM calls via CrewAI and Groq
- **LLM Evaluation Loop** — Offline eval suites, semantic fidelity scoring, hallucination detection, drift monitoring, and CI-ready regression gating
- **RAG Pipeline** — Real retrieval-augmented generation with Transformers.js embeddings and ChromaDB, running in-browser
- **Multi-Model Routing** — Live cost/latency/quality tradeoff routing across Llama 3.1 8B, 70B, and Mixtral via Groq
- **AI Governance** — RBAC, token spend controls, guardrails, HITL checkpoints, trace ID propagation, and OpenTelemetry observability
- **Enterprise Control Plane** — Org-wide AI governance dashboard with group spend limits and audit feeds
- **MCP Tool Use** — Model Context Protocol in action: LLM discovers and invokes tools dynamically
- **Local-First AI** — Florence-2 multimodal, ONNX quantization benchmarks, and vector search running fully in-browser via WebGPU

## Architecture

Six-layer enterprise AI architecture: Users → AI Experience → Agentic Orchestration → Intelligence → Tools/Data → Business Outcomes. Full diagram at https://www.prasadkavuri.com/#architecture.
Canonical diagram asset: `public/architecture-diagram.svg`.

## Stack

Next.js · TypeScript · Tailwind CSS · CrewAI · Groq · Transformers.js · ChromaDB · ONNX · OpenTelemetry · Upstash

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## About

Built by Prasad Kavuri — AI Engineering Leader with 20+ years scaling production AI platforms at Krutrim, Ola, and HERE Technologies. Open to VP / Head of AI Engineering roles in the Chicago area and beyond.
