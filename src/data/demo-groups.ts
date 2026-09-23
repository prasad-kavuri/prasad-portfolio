// Single source of truth for how demos are grouped on the homepage grid, the /demos gallery,
// and the agent marketplace. Every id in demos.ts must appear in exactly one group — enforced by
// src/__tests__/integration/demo-inventory-consistency.test.ts.

export type DemoGroupId = 'core' | 'agentic' | 'labs';

export type DemoGroup = {
  id: DemoGroupId;
  label: string;
  description: string;
  ids: readonly string[];
};

export const SIGNATURE_DEMO_ID = 'evaluation-showcase';

export const DEMO_GROUPS: readonly DemoGroup[] = [
  {
    id: 'core',
    label: 'Core AI Platform',
    description: 'Evaluation, grounded retrieval, and model routing economics',
    ids: ['evaluation-showcase', 'rag-pipeline', 'llm-router'],
  },
  {
    id: 'agentic',
    label: 'Agentic Systems & Governance',
    description: 'Orchestration, tool access, agent identity, human approval, privacy boundaries, and enterprise control',
    ids: ['multi-agent', 'mcp-demo', 'agent-auth', 'edge-agent-collaboration', 'enterprise-control-plane', 'generative-ui'],
  },
  {
    id: 'labs',
    label: 'Labs',
    description: 'Specialist experiments and utilities — outside the core platform story',
    ids: ['storm-research', 'world-generation', 'quantization', 'portfolio-assistant'],
  },
];
