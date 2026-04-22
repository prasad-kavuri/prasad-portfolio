# Prasad Kavuri AI Portfolio — Architecture & Development Skill

This skill provides context for developing, extending, and auditing the
prasadkavuri.com AI engineering portfolio — a production-grade Next.js 15 +
React 19 TypeScript platform demonstrating VP/Head-level AI engineering competency.

## When to Use This Skill

Use this skill when:
- Adding, modifying, or auditing any demo in the prasad-kavuri/prasad-portfolio repo
- Writing Claude Code prompts for this codebase
- Evaluating new AI capabilities for portfolio integration
- Generating governance, observability, or eval-related code
- Touching llms.txt, llms-full.txt, certifications, or GEO files

## Stack Identity

- Framework: Next.js 15 + React 19 + TypeScript (NOT static HTML)
- Deployment: Vercel (edge network)
- Styling: Tailwind CSS
- Rate limiting: Upstash Redis
- Local inference: vllm at localhost:8000 (Qwen MoE only)
- External models: Groq API (Llama 3.1 8B, 70B, Llama 3.3, Mixtral)
- In-browser inference: Transformers.js v4 (RAG, Vector Search, Multimodal, Quantization)

## Key Source Files

| File | Purpose |
|------|---------|
| src/data/demos.ts | Demo registry — source of truth for all 13 demos |
| src/data/certifications.ts | Cert data with featured/cluster fields |
| src/lib/guardrails.ts | Centralized prompt injection + output safety |
| src/lib/observability.ts | Trace-ID propagation + structured logging |
| src/lib/eval-engine.ts | LLM-as-Judge scoring + regression gating |
| src/lib/drift-monitor.ts | Online drift detection + hallucination heuristics |
| src/app/governance/page.tsx | Live governance dashboard |
| src/app/for-recruiters/page.tsx | Executive recruiter landing page |
| src/app/api/qwen-moe/route.ts | Qwen MoE proxy (isFallback:true on failure) |
| public/llms.txt | GEO agent summary + active focus section |
| public/llms-full.txt | Full professional context for LLM ingestion |
| docs/ARCHITECTURE.md | Platform coherence + control plane diagram |

## Platform Architecture (6 Layers)

1. Users & Channels → Web/Chat/Mobile
2. AI Experience Layer → 13 demos (Portfolio Assistant, Resume Generator, Multimodal, etc.)
3. Agentic Orchestration → Multi-agent (CrewAI), HITL checkpoint, guardrails
4. Intelligence Layer → LLM Router, RAG Pipeline, Vector Search, MCP Tools
5. Shared Infrastructure → guardrails.ts, observability.ts, eval-engine.ts, drift-monitor.ts
6. Business Outcomes → 70% cost reduction, $10M+ revenue, 13K+ customers

## Governance Rules (Non-Negotiable)

- Every new API route MUST import and call guardrails.ts input validation
- Every new API route MUST emit a trace-ID via observability.ts
- Rate limiting (Upstash) must be applied on all user-facing routes
- Fallback responses return HTTP 200 with isFallback:true — never 5xx
- No raw IPs stored — SHA-256 hash only
- All LLM output sanitized via DOMPurify before render

## Demo Count & Naming

There are exactly 13 demos. Do not increment this count without updating
src/data/demos.ts AND the homepage stat card AND README.md.

Current demos:
RAG Pipeline, LLM Router, Vector Search, AI Evaluation Showcase,
Browser Native AI Skill, Multi-Agent System, MCP Tool Demo,
Enterprise Control Plane, Spatial AI + World Modeling,
Portfolio Assistant, AI Hiring Intelligence, Multimodal Assistant,
Model Quantization

## Development Conventions

- Read-first-then-change: always read target files before editing
- Verify with: npx tsc --noEmit (no build required)
- Commit scope: one concern per commit, precise message
- Never touch unrelated files — scope is strict
- LLM Router: 5 parallel routes (4 Groq + 1 Qwen MoE)
- Quantization demo: ONNX INT8/FP32 benchmark + static Qwen MoE reference section

## Differentiating Signals (Preserve These)

- Governance layer: HITL checkpoint in multi-agent, drift monitoring, eval gating
- Shared infra lib: guardrails/observability/eval-engine used across ALL demos
- Hard business numbers: 200+ engineers, $10M+ revenue, 70% cost reduction
- Evaluation Showcase: flagship demo — offline + online eval + CI regression gate
- Qwen MoE: LLM Router 5th card (amber fallback when localhost:8000 offline)
- GEO layer: llms.txt Agent Summary + llms-full.txt 3-cluster taxonomy

## What NOT to Do

- Do not convert llms-full.txt to a table (hurts LLM summarization)
- Do not add fake SLA numbers to skill manifests
- Do not replace Groq-backed demos with Qwen (orchestrate, don't replace)
- Do not hardcode the governance dashboard timestamp (it must be dynamic)
- Do not create new demos without updating all three: demos.ts, homepage, README
