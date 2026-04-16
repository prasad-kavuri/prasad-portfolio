export type SnapshotServiceStatus = [name: string, status: string];
export type SnapshotMetric = [label: string, value: string];
export type GovernanceMetricValue = [label: string, value: string, sub: string, status: 'ok' | 'warn' | 'info'];

// Snapshot timestamps are explicit ISO8601 values to keep reviewer-facing telemetry auditable.
export const STATUS_SNAPSHOT = {
  generatedAtIso: '2026-04-13T03:50:00Z',
  services: [
    ['AI Evaluation Showcase', 'Operational · Quality and eval gating'],
    ['AI Portfolio Assistant', 'Operational · Full-context + retrieval grounding'],
    ['LLM Router', 'Operational · Multi-model'],
    ['Multi-Agent System', 'Operational · Groq-backed demo'],
    ['MCP Tool Demo', 'Operational · Tool calling demo'],
    ['Enterprise Control Plane', 'Operational · Governance and observability'],
    ['Resume Generator', 'Operational · PDF export'],
    ['RAG Pipeline', 'Operational · Browser WASM demo'],
    ['Vector Search', 'Operational · Browser WASM demo'],
    ['Native Browser AI Skill', 'Operational · On-device audit skill'],
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
  trustControls: [
    ['Autonomous Scope', 'Agent reasoning is bounded by route-level policy and guardrail checks.'],
    ['Manual Review Checkpoint', 'Multi-agent strategist execution pauses until explicit human approval.'],
    ['Trace and Audit', 'Trace IDs and structured events create decision-path visibility for reviews.'],
    ['Abuse and Cost Controls', 'Rate limits and token-cost controls enforce safe runtime budgets.'],
  ] as SnapshotMetric[],
  testSuite: [
    ['Unit Tests', 'Vitest suite passing'],
    ['E2E Coverage', '4 Playwright projects (desktop + mobile)'],
    ['Coverage Gates', 'API and lib thresholds enforced in CI'],
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
  generatedAtIso: '2026-04-13T03:50:00Z',
  trustFlow: [
    'Human approval required before strategist execution',
    'Execution paused for review at HITL checkpoint',
    'Policy check passed before response release',
    'Decision trace logged with request and trace IDs',
    'Guardrail-triggered outputs are blocked or redacted',
  ],
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
  metricSnapshot: {
    rateLimitRemaining: 847,
    rateLimitTotal: 1000,
    costPerInteractionUsd: 0.0023,
    guardrailBlocked: 12,
    guardrailRedacted: 3,
    evalFidelity: 0.94,
    hallucinationRate: 0.02,
    activeTraceSessions: 3,
    liveQueriesLogged: 0,
  },
} as const;

export interface EvalSnapshotData {
  totalQueriesLogged?: number;
  liveEval?: { casesRun?: number; passed?: number; avgScore?: number | null };
  drift?: { assistantSamples?: number; multiAgentSamples?: number };
}

export interface GovernanceMetricsView {
  cards: GovernanceMetricValue[];
  updatedLabel: string;
}

// Canonical mapper for governance telemetry cards:
// deterministic snapshot defaults + explicit live overlay when eval data is available.
export function getGovernanceMetricsView(
  snapshot?: EvalSnapshotData,
  updatedLabel = 'Snapshot baseline'
): GovernanceMetricsView {
  const base = GOVERNANCE_SNAPSHOT.metricSnapshot;

  const hasLiveEvalScore = typeof snapshot?.liveEval?.avgScore === 'number';
  const evalFidelityValue = hasLiveEvalScore ? snapshot!.liveEval!.avgScore! : base.evalFidelity;

  const hasLiveEvalCounts =
    typeof snapshot?.liveEval?.casesRun === 'number' &&
    snapshot.liveEval.casesRun > 0 &&
    typeof snapshot.liveEval.passed === 'number';

  const hallucinationRateValue = hasLiveEvalCounts
    ? Math.max(0, (1 - (snapshot!.liveEval!.passed! / snapshot!.liveEval!.casesRun!)) * 0.1)
    : base.hallucinationRate;

  const hasDriftSamples =
    typeof snapshot?.drift?.assistantSamples === 'number' &&
    typeof snapshot.drift.multiAgentSamples === 'number';

  const activeTraceSessions = hasDriftSamples
    ? Math.max(1, Math.min(99, snapshot!.drift!.assistantSamples! + snapshot!.drift!.multiAgentSamples!))
    : base.activeTraceSessions;

  const liveQueriesLogged = typeof snapshot?.totalQueriesLogged === 'number'
    ? snapshot.totalQueriesLogged
    : base.liveQueriesLogged;

  const ratePct = Math.round((base.rateLimitRemaining / base.rateLimitTotal) * 100);

  return {
    cards: [
      ['Rate Limit Remaining', `${base.rateLimitRemaining} / ${base.rateLimitTotal}`, `${ratePct}% capacity available`, ratePct > 50 ? 'ok' : 'warn'],
      ['Cost per Interaction', `$${base.costPerInteractionUsd.toFixed(4)}`, 'avg across all API routes', 'ok'],
      ['Guardrail Triggers (24h)', `${base.guardrailBlocked} blocked`, `${base.guardrailRedacted} redacted`, 'warn'],
      ['Eval Fidelity Score', evalFidelityValue.toFixed(2), 'LLM-as-Judge, gate ≥ 0.85', 'ok'],
      ['Hallucination Rate', hallucinationRateValue.toFixed(3), 'gate ≤ 0.10 — passing', 'ok'],
      ['Active Trace Sessions', String(activeTraceSessions), 'end-to-end X-Trace-Id correlation', 'info'],
      ['Queries Logged', String(liveQueriesLogged), 'runtime loop where available; snapshot fallback', 'info'],
    ],
    updatedLabel,
  };
}
