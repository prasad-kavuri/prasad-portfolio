import {
  AGENT_DEFINITIONS,
  type AgentId,
  type AuditEvent,
  type HandoffEvent,
  type HandoffStatus,
  type OrchestrationState,
} from '@/lib/agents/handoff-model';

export type OrchestratorAction =
  | { type: 'START_WORKFLOW'; traceId: string }
  | { type: 'ACTIVATE_AGENT'; agentId: AgentId }
  | { type: 'REQUEST_HANDOFF'; from: AgentId; to: AgentId; reason: string; contextSummary: string }
  | { type: 'ACCEPT_HANDOFF'; handoffId: string }
  | { type: 'BLOCK_HANDOFF'; handoffId: string; reason: string }
  | { type: 'REQUEST_APPROVAL'; handoffId: string }
  | { type: 'GRANT_APPROVAL'; handoffId: string }
  | { type: 'DENY_APPROVAL'; handoffId: string }
  | { type: 'COMPLETE_AGENT'; agentId: AgentId }
  | { type: 'COMPLETE_WORKFLOW' }
  | { type: 'FAIL_WORKFLOW'; reason: string };

function nextIsoTimestamp(version: number): string {
  return new Date((version + 1) * 1000).toISOString();
}

function nextId(prefix: string, version: number): string {
  return `${prefix}-${version + 1}`;
}

function appendAudit(
  state: OrchestrationState,
  params: Pick<AuditEvent, 'agentId' | 'eventType' | 'description' | 'severity'>
): OrchestrationState {
  const nextVersion = state.version + 1;
  const event: AuditEvent = {
    id: nextId('audit', state.version),
    traceId: state.traceId,
    timestamp: nextIsoTimestamp(state.version),
    ...params,
  };

  return {
    ...state,
    version: nextVersion,
    auditLog: [...state.auditLog, event],
  };
}

function appendIllegalTransition(state: OrchestrationState, message: string): OrchestrationState {
  return appendAudit(state, {
    agentId: 'system',
    eventType: 'workflow_failed',
    description: `Illegal transition blocked: ${message}`,
    severity: 'warn',
  });
}

function updateHandoffStatus(
  handoffs: HandoffEvent[],
  handoffId: string,
  status: HandoffStatus
): HandoffEvent[] {
  return handoffs.map((handoff) => (handoff.id === handoffId ? { ...handoff, status } : handoff));
}

function findHandoff(state: OrchestrationState, handoffId: string): HandoffEvent | undefined {
  return state.handoffs.find((handoff) => handoff.id === handoffId);
}

function isKnownAgent(value: string): value is AgentId {
  return value in AGENT_DEFINITIONS;
}

export function orchestrationReducer(
  state: OrchestrationState,
  action: OrchestratorAction
): OrchestrationState {
  if (action.type === 'START_WORKFLOW') {
    const started: OrchestrationState = {
      traceId: action.traceId,
      status: 'running',
      activeAgent: 'analyzer',
      handoffs: [],
      auditLog: [],
      version: 0,
    };

    return appendAudit(started, {
      agentId: 'system',
      eventType: 'workflow_started',
      description: 'Workflow initialized and analyzer is ready.',
      severity: 'info',
    });
  }

  if (state.status === 'idle') {
    return appendIllegalTransition(state, `${action.type} attempted while idle`);
  }

  if (action.type === 'ACTIVATE_AGENT') {
    if (state.status !== 'running' && state.status !== 'awaiting-approval') {
      return appendIllegalTransition(state, `${action.type} attempted in state ${state.status}`);
    }

    const next = appendAudit(
      {
        ...state,
        activeAgent: action.agentId,
      },
      {
        agentId: action.agentId,
        eventType: 'agent_activated',
        description: `${AGENT_DEFINITIONS[action.agentId].label} activated.`,
        severity: 'info',
      }
    );
    return next;
  }

  if (action.type === 'REQUEST_HANDOFF') {
    if (state.status !== 'running') {
      return appendIllegalTransition(state, `${action.type} attempted in state ${state.status}`);
    }

    const validAgents = isKnownAgent(action.from) && isKnownAgent(action.to);
    const allowedDestination =
      validAgents && AGENT_DEFINITIONS[action.from].canHandoffTo.includes(action.to);

    const blocked = !validAgents || !allowedDestination;
    const handoffId = nextId('handoff', state.version);
    const handoff: HandoffEvent = {
      id: handoffId,
      fromAgent: action.from,
      toAgent: action.to,
      reason: action.reason,
      contextSummary: action.contextSummary.slice(0, 1000),
      status: blocked ? 'blocked' : 'pending',
      traceId: state.traceId,
      timestamp: nextIsoTimestamp(state.version),
    };

    const withHandoff = {
      ...state,
      handoffs: [...state.handoffs, handoff],
    };

    return appendAudit(withHandoff, {
      agentId: action.from,
      eventType: blocked ? 'handoff_blocked' : 'handoff_requested',
      description: blocked
        ? `Handoff blocked from ${action.from} to ${action.to}.`
        : `Handoff requested from ${action.from} to ${action.to}.`,
      severity: blocked ? 'warn' : 'info',
    });
  }

  if (action.type === 'ACCEPT_HANDOFF') {
    const handoff = findHandoff(state, action.handoffId);
    if (!handoff || (handoff.status !== 'pending' && handoff.status !== 'approved')) {
      return appendIllegalTransition(state, `${action.type} attempted for unavailable handoff ${action.handoffId}`);
    }

    const updatedState = {
      ...state,
      activeAgent: handoff.toAgent,
      handoffs: updateHandoffStatus(state.handoffs, action.handoffId, 'accepted'),
      status: state.status === 'awaiting-approval' ? 'running' : state.status,
    };

    return appendAudit(updatedState, {
      agentId: handoff.toAgent,
      eventType: 'handoff_accepted',
      description: `${AGENT_DEFINITIONS[handoff.toAgent].label} accepted handoff.`,
      severity: 'ok',
    });
  }

  if (action.type === 'BLOCK_HANDOFF') {
    const handoff = findHandoff(state, action.handoffId);
    if (!handoff) {
      return appendIllegalTransition(state, `${action.type} attempted for unknown handoff ${action.handoffId}`);
    }

    const updatedState = {
      ...state,
      handoffs: updateHandoffStatus(state.handoffs, action.handoffId, 'blocked'),
    };

    return appendAudit(updatedState, {
      agentId: handoff.fromAgent,
      eventType: 'handoff_blocked',
      description: `Handoff from ${handoff.fromAgent} to ${handoff.toAgent} blocked: ${action.reason}`,
      severity: 'warn',
    });
  }

  if (action.type === 'REQUEST_APPROVAL') {
    const handoff = findHandoff(state, action.handoffId);
    if (!handoff || handoff.status !== 'accepted') {
      return appendIllegalTransition(state, `${action.type} attempted for unavailable handoff ${action.handoffId}`);
    }

    const updatedState = {
      ...state,
      status: 'awaiting-approval' as const,
      handoffs: updateHandoffStatus(state.handoffs, action.handoffId, 'awaiting-approval'),
    };

    return appendAudit(updatedState, {
      agentId: 'human',
      eventType: 'approval_requested',
      description: 'Human approval requested before final release.',
      severity: 'info',
    });
  }

  if (action.type === 'GRANT_APPROVAL') {
    const handoff = findHandoff(state, action.handoffId);
    if (!handoff || state.status !== 'awaiting-approval' || handoff.status !== 'awaiting-approval') {
      return appendIllegalTransition(state, `${action.type} attempted outside approval window`);
    }

    const updatedState = {
      ...state,
      status: 'running' as const,
      handoffs: updateHandoffStatus(state.handoffs, action.handoffId, 'approved'),
    };

    return appendAudit(updatedState, {
      agentId: 'human',
      eventType: 'approval_granted',
      description: 'Human approval granted. Workflow resumed.',
      severity: 'ok',
    });
  }

  if (action.type === 'DENY_APPROVAL') {
    const handoff = findHandoff(state, action.handoffId);
    if (!handoff || state.status !== 'awaiting-approval' || handoff.status !== 'awaiting-approval') {
      return appendIllegalTransition(state, `${action.type} attempted outside approval window`);
    }

    const updatedState = {
      ...state,
      status: 'running' as const,
      handoffs: updateHandoffStatus(state.handoffs, action.handoffId, 'denied'),
    };

    return appendAudit(updatedState, {
      agentId: 'human',
      eventType: 'approval_denied',
      description: 'Human approval denied. Workflow requires revision.',
      severity: 'warn',
    });
  }

  if (action.type === 'COMPLETE_AGENT') {
    if (state.activeAgent !== action.agentId) {
      return appendIllegalTransition(state, `${action.type} attempted for inactive agent ${action.agentId}`);
    }

    const updatedState = {
      ...state,
      activeAgent: null,
    };

    return appendAudit(updatedState, {
      agentId: action.agentId,
      eventType: 'output_generated',
      description: `${AGENT_DEFINITIONS[action.agentId].label} completed output.`,
      severity: 'ok',
    });
  }

  if (action.type === 'COMPLETE_WORKFLOW') {
    if (state.status !== 'running') {
      return appendIllegalTransition(state, `${action.type} attempted in state ${state.status}`);
    }

    const updatedState = {
      ...state,
      status: 'completed' as const,
      activeAgent: null,
      handoffs: state.handoffs.map((handoff) => {
        if (handoff.status === 'accepted' || handoff.status === 'approved') {
          return { ...handoff, status: 'completed' as const };
        }
        return handoff;
      }),
    };

    return appendAudit(updatedState, {
      agentId: 'system',
      eventType: 'workflow_completed',
      description: 'Workflow completed successfully.',
      severity: 'ok',
    });
  }

  if (action.type === 'FAIL_WORKFLOW') {
    const updatedState = {
      ...state,
      status: 'failed' as const,
      activeAgent: null,
    };

    return appendAudit(updatedState, {
      agentId: 'system',
      eventType: 'workflow_failed',
      description: action.reason,
      severity: 'warn',
    });
  }

  return state;
}
