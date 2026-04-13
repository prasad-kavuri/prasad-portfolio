export type SnapshotServiceStatus = [name: string, status: string];
export type SnapshotMetric = [label: string, value: string];

export const STATUS_SNAPSHOT = {
  generatedAtIso: '2026-04-13T00:00:00.000Z',
  generatedAtLabel: 'April 2026 snapshot',
  services: [
    ['AI Portfolio Assistant', 'Operational · Full-context + retrieval grounding'],
    ['LLM Router', 'Operational · Multi-model'],
    ['Multi-Agent System', 'Operational · Groq-backed demo'],
    ['MCP Tool Demo', 'Operational · Tool calling demo'],
    ['Resume Generator', 'Operational · PDF export'],
    ['RAG Pipeline', 'Operational · Browser WASM demo'],
    ['Vector Search', 'Operational · Browser WASM demo'],
    ['Multimodal Assistant', 'Operational · WebGPU demo'],
    ['Model Quantization', 'Operational · ONNX demo'],
  ] satisfies SnapshotServiceStatus[],
  securityPosture: [
    'Content Security Policy (CSP) — Active',
    'Rate Limiting (Upstash Redis) — Active',
    'SSRF Protection — Active',
    'XSS Sanitization (DOMPurify) — Active',
    'Prompt Injection Detection — Active',
    'Output Guardrails — Active',
    'SHA-256 IP Hashing — Active',
    'npm audit (CI-enforced) — 0 high/critical CVEs',
  ],
  testSuite: [
    ['Unit Tests', '361 passing'],
    ['E2E Coverage', '4 Playwright projects'],
    ['Test Files', '32 files'],
    ['Coverage', '95%+ statements'],
    ['Fuzz Tests', 'Active'],
    ['LLM Evals', 'Active'],
    ['Chaos Tests', 'Active'],
    ['CI Pipeline', 'Parallel (lint + e2e matrix)'],
  ] satisfies SnapshotMetric[],
  stack: [
    'Next.js 16.2.3', 'React 19.2.5',
    'Tailwind CSS v4', 'TypeScript 5',
    'Groq SDK 1.1.2', 'Transformers.js v4',
    'Vitest 4', 'Playwright 1.59',
  ],
} as const;

export const GOVERNANCE_SNAPSHOT = {
  generatedAtIso: '2026-04-13T00:00:00.000Z',
  policyControls: [
    { label: 'Content Security Policy', status: 'Active', detail: 'next.config.ts + proxy.ts' },
    { label: 'Rate Limiting (Upstash Redis)', status: 'Active', detail: '10 req / 60s per IP, SHA-256 hash' },
    { label: 'Prompt Injection Detection', status: 'Active', detail: 'src/lib/guardrails.ts — centralized signatures' },
    { label: 'Competitor Mention Filter', status: 'Active', detail: 'Redacts 8 competitor names' },
    { label: 'Hallucination Heuristic', status: 'Active', detail: 'Key-fact presence check on long outputs' },
    { label: 'XSS Sanitization (DOMPurify)', status: 'Active', detail: 'All LLM output before render' },
    { label: 'IP SHA-256 Hashing', status: 'Active', detail: 'Never raw IPs in storage' },
    { label: 'npm audit (CI-enforced)', status: 'Active', detail: '0 high/critical CVEs' },
    { label: 'Eval Regression Gate', status: 'Active', detail: 'fidelity ≥ 0.85, halluc. ≤ 0.10' },
    { label: 'HITL Checkpoint (Multi-Agent)', status: 'Active', detail: 'Human approval before Strategist runs' },
  ] as const,
  auditLog: [
    { time: '14:07:58', event: 'guardrail.blocked', detail: 'Prompt injection detected — IP redacted', severity: 'warn' },
    { time: '14:05:03', event: 'guardrail.redacted', detail: 'Competitor mention filtered from output', severity: 'info' },
    { time: '14:03:12', event: 'eval.regression', detail: 'Fidelity Δ +0.02 vs baseline — within gate', severity: 'ok' },
    { time: '14:01:44', event: 'rate_limit.triggered', detail: '429 issued to IP hash a93aa730', severity: 'warn' },
    { time: '13:58:31', event: 'deploy.passed', detail: 'CI gate passed — fidelity 0.94, halluc. 0.02', severity: 'ok' },
    { time: '13:55:09', event: 'guardrail.blocked', detail: 'Template injection {{}} in query body', severity: 'warn' },
    { time: '13:51:22', event: 'eval.completed', detail: 'Snapshot run — eval posture recorded', severity: 'ok' },
  ] as const,
  metricBaselines: {
    rateLimitRemaining: { base: 847, range: 30 },
    rateLimitTotal: 1000,
    costPerInteractionUsd: { base: 0.0023, range: 0.0004, digits: 4 },
    guardrailBlocked: { base: 12, range: 3 },
    guardrailRedacted: { base: 3, range: 1 },
    evalFidelityFallback: { base: 0.94, range: 0.02, digits: 2 },
    hallucinationFallback: { base: 0.02, range: 0.005, digits: 3 },
    activeTraceSessions: { base: 3, range: 2 },
  },
} as const;

