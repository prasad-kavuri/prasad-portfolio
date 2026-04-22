---
name: prasad-portfolio
description: "Architecture context, governance rules, file map, and dev conventions for the prasadkavuri.com AI engineering portfolio. Use when adding demos, modifying governance/observability code, touching llms.txt or certifications, or writing Claude Code prompts for this Next.js 15 + React 19 TypeScript codebase."
---

# Prasad Kavuri AI Portfolio — Architecture & Development Skill

This skill provides full context for developing, extending, and auditing the
prasadkavuri.com AI engineering portfolio — a production-grade Next.js 15 +
React 19 TypeScript platform demonstrating VP/Head-level AI engineering competency.

## When to Use This Skill

Use when:
- Adding, modifying, or auditing any demo in this repo
- Writing Claude Code prompts for this codebase
- Touching llms.txt, llms-full.txt, certifications data, or GEO files
- Generating governance, observability, or eval-related code
- Evaluating new AI capabilities for portfolio integration

## Stack Identity

- Framework: Next.js 15 + React 19 + TypeScript (NOT static HTML)
- Deployment: Vercel (edge network)
- Styling: Tailwind CSS
- Rate limiting: Upstash Redis
- Local inference: vllm at localhost:8000 (Qwen MoE only — fallback expected in prod)
- External models: Groq API (Llama 3.1 8B, 70B, Llama 3.3, Mixtral)
- In-browser inference: Transformers.js v4 (RAG, Vector Search, Multimodal, Quantization)

## Key Source Files

| File | Purpose |
|------|---------|
| src/data/demos.ts | Demo registry — source of truth for all 13 demos |
| src/data/certifications.ts | Cert data with featured:true + cluster field taxonomy |
| src/lib/guardrails.ts | Centralized prompt injection + output safety |
| src/lib/observability.ts | Trace-ID propagation + structured logging |
| src/lib/eval-engine.ts | LLM-as-Judge scoring + regression gating |
| src/lib/drift-monitor.ts | Online drift detection + hallucination heuristics |
| src/app/governance/page.tsx | Live governance dashboard (dynamic timestamp) |
| src/app/for-recruiters/page.tsx | Executive recruiter landing page |
| src/app/api/qwen-moe/route.ts | Qwen MoE proxy (HTTP 200 + isFallback:true on failure) |
| public/llms.txt | GEO agent summary + active focus + cert clusters |
| public/llms-full.txt | Full professional context for LLM ingestion |
| docs/ARCHITECTURE.md | Platform coherence + control plane diagram |

## Platform Architecture (6 Layers)

1. Users & Channels — Web/Chat/Mobile
2. AI Experience Layer — 13 demos
3. Agentic Orchestration — Multi-agent (CrewAI), HITL checkpoint, guardrails
4. Intelligence Layer — LLM Router, RAG, Vector Search, MCP Tools
5. Shared Infrastructure — guardrails.ts, observability.ts, eval-engine.ts, drift-monitor.ts
6. Business Outcomes — 70% cost reduction, $10M+ revenue, 13K+ customers

## Governance Rules (Non-Negotiable)

- Every new API route MUST call guardrails.ts input validation
- Every new API route MUST emit a trace-ID via observability.ts
- Rate limiting (Upstash) must apply on all user-facing routes
- Fallback responses return HTTP 200 with isFallback:true — never 5xx
- No raw IPs stored — SHA-256 hash only
- All LLM output sanitized via DOMPurify before render
- Governance dashboard timestamp must be dynamic, never hardcoded

## Demo Registry — Exactly 13 Demos

Do not change this count without updating: src/data/demos.ts + homepage stat card + README.md

RAG Pipeline · LLM Router · Vector Search · AI Evaluation Showcase ·
Browser Native AI Skill · Multi-Agent System · MCP Tool Demo ·
Enterprise Control Plane · Spatial AI + World Modeling ·
Portfolio Assistant · AI Hiring Intelligence · Multimodal Assistant ·
Model Quantization

## LLM Router — 5 Parallel Model Routes

1. Llama 3.1 8B (Groq)
2. Llama 3.1 70B (Groq)
3. Llama 3.3 (Groq)
4. Mixtral (Groq)
5. Qwen3.6-35B-A3B-int4 MoE — via localhost:8000, amber fallback card in prod

## Development Conventions

- Read every target file before editing — no blind writes
- Verify with: npx tsc --noEmit (type check only, no build needed)
- One concern per commit, precise scoped message
- Never touch unrelated files — scope is strict
- Claude Code prompts follow read-first-then-change structure

## Differentiating Signals — Preserve These

- Governance layer: HITL checkpoint, drift monitoring, eval gating
- Shared infra lib: guardrails/observability/eval-engine wired across ALL demos
- Business numbers: 200+ engineers, $10M+ revenue, 70% cost reduction
- Evaluation Showcase: flagship — offline + online eval + CI regression gate
- GEO layer: llms.txt Agent Summary + llms-full.txt 3-cluster taxonomy + Active Focus section

## What NOT To Do

- Do not convert llms-full.txt to a table (hurts LLM summarization)
- Do not add fake SLA numbers anywhere
- Do not replace Groq-backed demos with Qwen — orchestrate, don't replace
- Do not create new demos without updating demos.ts + homepage + README
- Do not use 5xx responses for expected fallback states
