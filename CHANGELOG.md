# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-04-19

First public release of the AI Engineering Portfolio Platform.

### Platform

- **13 live AI demos** across browser WASM, WebGPU, and server-side inference — RAG Pipeline, LLM Router, Vector Search, AI Evaluation Showcase, Multi-Agent System, MCP Tool Demo, AI Portfolio Assistant, Resume Generator, Multimodal Assistant, Model Quantization, Enterprise Control Plane, Native Browser AI Skill, AI Spatial Intelligence & World Generation
- **Shared governance layer** — guardrails, eval gating, HITL checkpoints, drift monitoring, and observability shared across all demos via `src/lib/`
- **Enterprise Control Plane** with RBAC, group spend limits, token-cost tracking, and structured observability feed
- **AI Evaluation Showcase** as the signature system — closed-loop LLM eval pipeline with semantic fidelity scoring, hallucination detection, and CI regression gating

### Infrastructure

- Next.js 16.2.4 App Router + Turbopack, React 19.2.5, TypeScript 5.9.3 strict mode, Tailwind CSS 4.2.4
- Groq API (server LLM) + `@huggingface/transformers` v4 (browser WASM/WebGPU)
- Upstash Redis rate limiting, Vercel deployment (serverless API routes + static assets)
- Comprehensive test suite — unit, integration, fuzz, eval, E2E (Playwright: chromium, firefox, webkit, mobile)

### Governance and Security

- Centralized guardrails with prompt injection detection, competitor redaction, hallucination heuristics
- XSS sanitization (DOMPurify) on all LLM output before render
- SHA-256 IP hashing — never raw IPs in storage
- CSP, COEP/COOP headers enforced in `next.config.ts` and edge middleware
- CI-enforced `npm audit --audit-level=high` gate

### SEO and Discoverability

- Canonical URLs unified to `https://www.prasadkavuri.com` (with www) across all metadata
- Legacy `.html` demo routes permanently 301-redirected to canonical paths
- Sitemap generation derives entries directly from `src/data/demos.ts`
- AI agent manifest at `/.well-known/ai-agent-manifest.json`

### Executive metrics module

- `src/lib/executive-metrics.ts` as single source of truth for 5 canonical proof points
- Homepage hero stats grid and `/for-recruiters` summary cards both consume the same module
- `costReductionDisplay` field keeps numeric `70%` for stat card animation while `costReductionDelivered` preserves the `Up to 70%` qualifier for prose
