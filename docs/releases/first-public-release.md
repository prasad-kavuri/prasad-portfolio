# v1.0.0 — AI Engineering Portfolio Platform

**Release date:** April 2026  
**Live site:** https://www.prasadkavuri.com

---

Production-grade AI engineering portfolio platform demonstrating governed, observable, evaluated AI systems across 13 live demos.

## What's Included

### 13 Live Demos

| Demo | Engine | Mode |
|------|--------|------|
| RAG Pipeline | Transformers.js · all-MiniLM-L6-v2 · ChromaDB | Browser WASM |
| LLM Router | Groq · Llama 3.1 8B / 70B · Mixtral | Server |
| Vector Search | sentence-BERT · UMAP · Cosine similarity | Browser WASM |
| AI Evaluation Showcase ⭐ | LLM-as-Judge · Guardrails · CI gating | Server |
| Multi-Agent System | CrewAI · Groq · Llama 3.3 70B | Server |
| MCP Tool Demo | MCP protocol · Groq tool calling | Server |
| AI Portfolio Assistant | Vercel AI SDK · Streaming · RAG grounding | Server |
| Resume Generator | Groq · JD parsing · Skill matching | Server |
| Multimodal Assistant | Florence-2 · WebGPU · Transformers.js | Browser WebGPU |
| Model Quantization | ONNX · INT8 vs FP32 · Transformers.js | Browser WASM |
| Enterprise Control Plane | RBAC · Structured observability · Token analytics | Server |
| Native Browser AI Skill | Chrome Prompt API · Gemini Nano | Browser |
| AI Spatial Intelligence | Three.js · GLB export · Governance gates | Server + Browser |

⭐ Signature system — recommended first stop for technical reviewers.

### Governance Layer

Every demo runs through shared platform controls in `src/lib/`:

- **Guardrails** — prompt injection detection, competitor redaction, hallucination heuristics, XSS sanitization (DOMPurify)
- **Eval gating** — offline eval suites, CI regression thresholds, LLM-as-Judge scoring
- **HITL checkpoints** — human approval required before high-stakes multi-agent transitions
- **Observability** — trace IDs, structured logs, drift monitoring, cost-per-interaction tracking
- **Rate limiting** — Upstash Redis, SHA-256 IP hashing, per-route spend gates

### Tech Stack

- Next.js 16.2.4 App Router + Turbopack · React 19.2.5 · TypeScript 5.9.3 strict · Tailwind CSS 4.2.4
- Groq API (server LLM) · `@huggingface/transformers` v4 (browser WASM/WebGPU)
- Upstash Redis · Vercel (serverless API routes + static assets)
- Canonical host: `https://www.prasadkavuri.com`

### Testing

Comprehensive test suite covering unit, integration, fuzz, eval, and E2E tests (Playwright: chromium, firefox, webkit, mobile). 661+ tests passing at release.

CI quality gates: API routes ≥ 90% statements / ≥ 85% branches; lib ≥ 95% functions; `npm audit --audit-level=high` clean.

## Verification

```bash
npm run lint          # 0 errors
npm run test          # all tests passing
npm run build         # clean production build
npm audit --audit-level=high  # 0 high/critical CVEs
```

## Compatibility Notes

- Legacy `.html` demo URLs are permanently 301-redirected to canonical routes
- Canonical demo discovery path is `/demos`
- All URLs use `https://www.prasadkavuri.com` (with www)
