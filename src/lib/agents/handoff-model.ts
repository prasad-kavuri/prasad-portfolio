export type AgentId = 'analyzer' | 'researcher' | 'strategist' | 'hitl' | 'synthesizer';

export type HandoffStatus =
  | 'pending'
  | 'accepted'
  | 'blocked'
  | 'awaiting-approval'
  | 'approved'
  | 'denied'
  | 'completed';

export interface AgentDefinition {
  id: AgentId;
  label: string;
  role: string;
  canHandoffTo: AgentId[];
  requiresApproval: boolean;
}

export interface HandoffEvent {
  id: string;
  fromAgent: AgentId;
  toAgent: AgentId;
  reason: string;
  contextSummary: string;
  status: HandoffStatus;
  timestamp: string;
  traceId: string;
}

export interface AuditEvent {
  id: string;
  traceId: string;
  timestamp: string;
  agentId: AgentId | 'system' | 'human';
  eventType:
    | 'workflow_started'
    | 'agent_activated'
    | 'handoff_requested'
    | 'handoff_accepted'
    | 'handoff_blocked'
    | 'approval_requested'
    | 'approval_granted'
    | 'approval_denied'
    | 'output_generated'
    | 'workflow_completed'
    | 'workflow_failed';
  description: string;
  severity: 'info' | 'warn' | 'ok';
}

export interface OrchestrationState {
  traceId: string;
  status: 'idle' | 'running' | 'awaiting-approval' | 'completed' | 'failed';
  activeAgent: AgentId | null;
  handoffs: HandoffEvent[];
  auditLog: AuditEvent[];
  version: number;
}

export const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {
  analyzer: {
    id: 'analyzer',
    label: 'Analyzer',
    role: 'Surface architecture and UX signals',
    canHandoffTo: ['researcher'],
    requiresApproval: false,
  },
  researcher: {
    id: 'researcher',
    label: 'Researcher',
    role: 'Compare against patterns and best practices',
    canHandoffTo: ['strategist'],
    requiresApproval: false,
  },
  strategist: {
    id: 'strategist',
    label: 'Strategist',
    role: 'Draft decision-ready recommendation',
    canHandoffTo: ['hitl'],
    requiresApproval: false,
  },
  hitl: {
    id: 'hitl',
    label: 'Human Review',
    role: 'Approval checkpoint before final release',
    canHandoffTo: ['synthesizer'],
    requiresApproval: true,
  },
  synthesizer: {
    id: 'synthesizer',
    label: 'Synthesizer',
    role: 'Publish executive-readable final output',
    canHandoffTo: [],
    requiresApproval: false,
  },
};

export const AGENT_ORDER: AgentId[] = ['analyzer', 'researcher', 'strategist', 'hitl', 'synthesizer'];

export const INITIAL_ORCHESTRATION_STATE: OrchestrationState = {
  traceId: '',
  status: 'idle',
  activeAgent: null,
  handoffs: [],
  auditLog: [],
  version: 0,
};
