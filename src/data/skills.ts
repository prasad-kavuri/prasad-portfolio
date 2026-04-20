export type SkillCategory =
  | 'Observability'
  | 'Governance'
  | 'Evaluation'
  | 'Orchestration'
  | 'Safety'
  | 'Memory';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  inputContract: string;   // What goes in
  outputContract: string;  // What comes out
  sourceFile: string;      // e.g. src/lib/guardrails.ts
  usedInDemos: string[];   // matches demo `id` fields from demos.ts
  productionSignal: string; // One-liner on why this matters at scale
}

export const SKILLS: Skill[] = [
  {
    id: 'guardrails',
    name: 'Guardrails',
    category: 'Safety',
    description:
      'Content filtering and policy enforcement layer. Intercepts model output before it reaches the user, enforcing topic boundaries, competitor mention rules, and toxicity thresholds.',
    inputContract: 'Raw LLM output string + active policy config',
    outputContract: 'Filtered string + violation log entry (if triggered)',
    sourceFile: 'src/lib/guardrails.ts',
    usedInDemos: ['portfolio-assistant', 'multi-agent', 'llm-router'],
    productionSignal:
      'Prevents brand/compliance risk in customer-facing deployments without re-prompting the model on every call.',
  },
  {
    id: 'observability',
    name: 'Observability & Tracing',
    category: 'Observability',
    description:
      'End-to-end Trace-ID propagation across all agent hops. Every request gets a correlation ID that flows through model calls, tool invocations, and API responses — enabling full lineage replay.',
    inputContract: 'Incoming request + optional parent trace-id header',
    outputContract: 'Enriched request context with trace-id, span metadata, and timing',
    sourceFile: 'src/lib/observability.ts',
    usedInDemos: ['multi-agent', 'rag-pipeline', 'mcp-demo'],
    productionSignal:
      'Reduces mean time-to-diagnose from hours to minutes when model behaviour regresses in production.',
  },
  {
    id: 'eval-engine',
    name: 'Evaluation Engine',
    category: 'Evaluation',
    description:
      'Automated scoring of model outputs against ground-truth rubrics. Runs latency, relevance, hallucination, and policy-compliance checks as a CI gate and live health signal.',
    inputContract: 'Model output + evaluation rubric (JSON) + optional reference answer',
    outputContract: 'Score object with per-dimension breakdown and pass/fail flag',
    sourceFile: 'src/lib/eval-engine.ts',
    usedInDemos: ['multi-agent', 'llm-router', 'portfolio-assistant'],
    productionSignal:
      'Closes the feedback loop between deploy and degrade — catches quality regressions before users report them.',
  },
  {
    id: 'drift-monitor',
    name: 'Drift Monitor',
    category: 'Evaluation',
    description:
      'Tracks statistical shifts in model output distributions over time. Alerts when response length, tone, or topic distribution deviates beyond a configured threshold from the baseline window.',
    inputContract: 'Rolling window of model responses + baseline statistics',
    outputContract: 'Drift score (0–1), alert flag, and delta report vs. baseline',
    sourceFile: 'src/lib/drift-monitor.ts',
    usedInDemos: ['multi-agent', 'llm-router'],
    productionSignal:
      'Detects silent model degradation — e.g. after a provider-side model update — without requiring explicit user feedback.',
  },
  {
    id: 'hitl',
    name: 'Human-in-the-Loop (HITL)',
    category: 'Governance',
    description:
      'Structured approval checkpoint between autonomous agent steps. Pauses execution after high-stakes decisions, surfaces a review payload to the operator, and resumes only on explicit approval.',
    inputContract: 'Agent action proposal + confidence score + context snapshot',
    outputContract: 'Approval decision (approve / reject / modify) + audit log entry',
    sourceFile: 'src/app/demos/multi-agent/page.tsx',
    usedInDemos: ['multi-agent'],
    productionSignal:
      'The industry-standard pattern for keeping humans in control of agentic systems in regulated industries (finance, healthcare, legal).',
  },
  {
    id: 'planning',
    name: 'Agent Planning',
    category: 'Orchestration',
    description:
      'Decomposes a high-level user goal into an ordered sequence of sub-tasks, assigns each to the appropriate specialist agent, and manages execution order with dependency awareness.',
    inputContract: 'User goal string + available agent registry',
    outputContract: 'Ordered execution plan with agent assignments and fallback paths',
    sourceFile: 'src/app/demos/multi-agent/page.tsx',
    usedInDemos: ['multi-agent', 'resume-generator'],
    productionSignal:
      'Separates "what to do" from "how to do it" — enabling the orchestration layer to be model-agnostic and swappable.',
  },
];

// Helper: look up skills by demo id
export function getSkillsForDemo(demoId: string): Skill[] {
  return SKILLS.filter((s) => s.usedInDemos.includes(demoId));
}

// Helper: get all unique categories
export function getSkillCategories(): SkillCategory[] {
  return [...new Set(SKILLS.map((s) => s.category))];
}
