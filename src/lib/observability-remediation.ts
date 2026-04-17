export type DriftLifecycleStatus =
  | 'stable'
  | 'drift_detected'
  | 'awaiting_approval'
  | 'remediating'
  | 'stabilized';

export type RemediationMode = 'auto' | 'human';

export interface DriftMetrics {
  modelConfidence: number;
  retrievalQuality: number;
  latencyP95Ms: number;
  driftScore: number;
}

export type DriftEventKind =
  | 'drift_detected'
  | 'fallback_engaged'
  | 'awaiting_human_approval'
  | 'human_approved'
  | 'human_cancelled'
  | 'index_refreshed'
  | 'eval_passed'
  | 'stabilized'
  | 'monitoring_resumed';

export interface DriftEvent {
  id: string;
  kind: DriftEventKind;
  title: string;
  detail: string;
  occurredAtIso: string;
}

export interface DriftLifecycleState {
  mode: RemediationMode;
  status: DriftLifecycleStatus;
  metrics: DriftMetrics;
  events: DriftEvent[];
  cycle: number;
  stableTicks: number;
  remediationStep: number;
}

export type DriftLifecycleAction =
  | { type: 'TICK' }
  | { type: 'SET_MODE'; mode: RemediationMode }
  | { type: 'APPROVE_REMEDIATION' }
  | { type: 'CANCEL_REMEDIATION' }
  | { type: 'RESET' };

const MAX_EVENTS = 10;

const METRICS: Record<DriftLifecycleStatus, DriftMetrics> = {
  stable: {
    modelConfidence: 0.95,
    retrievalQuality: 0.93,
    latencyP95Ms: 420,
    driftScore: 0.18,
  },
  drift_detected: {
    modelConfidence: 0.84,
    retrievalQuality: 0.74,
    latencyP95Ms: 910,
    driftScore: 0.81,
  },
  awaiting_approval: {
    modelConfidence: 0.84,
    retrievalQuality: 0.74,
    latencyP95Ms: 910,
    driftScore: 0.81,
  },
  remediating: {
    modelConfidence: 0.88,
    retrievalQuality: 0.81,
    latencyP95Ms: 660,
    driftScore: 0.56,
  },
  stabilized: {
    modelConfidence: 0.96,
    retrievalQuality: 0.94,
    latencyP95Ms: 430,
    driftScore: 0.14,
  },
};

const REMEDIATION_STEPS: Array<{ metrics: DriftMetrics; event: Omit<DriftEvent, 'id' | 'occurredAtIso'> }> = [
  {
    metrics: {
      modelConfidence: 0.88,
      retrievalQuality: 0.81,
      latencyP95Ms: 660,
      driftScore: 0.56,
    },
    event: {
      kind: 'fallback_engaged',
      title: 'Fallback model engaged',
      detail: 'Shifted to validated fallback model while preserving response continuity.',
    },
  },
  {
    metrics: {
      modelConfidence: 0.91,
      retrievalQuality: 0.88,
      latencyP95Ms: 590,
      driftScore: 0.37,
    },
    event: {
      kind: 'index_refreshed',
      title: 'Index refreshed and retrieval recalibrated',
      detail: 'Vector index and ranking weights refreshed to restore retrieval precision.',
    },
  },
  {
    metrics: {
      modelConfidence: 0.95,
      retrievalQuality: 0.93,
      latencyP95Ms: 460,
      driftScore: 0.2,
    },
    event: {
      kind: 'eval_passed',
      title: 'Evaluation check passed',
      detail: 'Post-remediation eval gate cleared against governance quality thresholds.',
    },
  },
];

function nowIso() {
  return new Date().toISOString();
}

function appendEvent(state: DriftLifecycleState, event: Omit<DriftEvent, 'id' | 'occurredAtIso'>): DriftLifecycleState {
  const next: DriftEvent = {
    ...event,
    id: `${event.kind}-${state.cycle}-${state.events.length + 1}`,
    occurredAtIso: nowIso(),
  };
  return {
    ...state,
    events: [next, ...state.events].slice(0, MAX_EVENTS),
  };
}

export function createInitialDriftLifecycleState(mode: RemediationMode = 'auto'): DriftLifecycleState {
  return {
    mode,
    status: 'stable',
    metrics: METRICS.stable,
    events: [
      {
        id: 'initial-stable-1',
        kind: 'monitoring_resumed',
        title: 'Monitoring baseline established',
        detail: 'System is stable and drift watch is active.',
        occurredAtIso: nowIso(),
      },
    ],
    cycle: 0,
    stableTicks: 0,
    remediationStep: 0,
  };
}

function beginDriftDetection(state: DriftLifecycleState): DriftLifecycleState {
  return appendEvent(
    {
      ...state,
      cycle: state.cycle + 1,
      stableTicks: 0,
      remediationStep: 0,
      status: 'drift_detected',
      metrics: METRICS.drift_detected,
    },
    {
      kind: 'drift_detected',
      title: 'Drift detected',
      detail: 'Confidence and retrieval quality dropped below acceptable operating range.',
    }
  );
}

function startRemediation(state: DriftLifecycleState): DriftLifecycleState {
  const step = REMEDIATION_STEPS[0];
  return appendEvent(
    {
      ...state,
      status: 'remediating',
      remediationStep: 1,
      metrics: step.metrics,
    },
    step.event
  );
}

function completeStabilization(state: DriftLifecycleState): DriftLifecycleState {
  const withStabilized = appendEvent(
    {
      ...state,
      status: 'stabilized',
      metrics: METRICS.stabilized,
      stableTicks: 0,
    },
    {
      kind: 'stabilized',
      title: 'System stabilized',
      detail: 'Remediation completed and service health returned to baseline.',
    }
  );
  return withStabilized;
}

export function driftLifecycleReducer(
  state: DriftLifecycleState,
  action: DriftLifecycleAction
): DriftLifecycleState {
  switch (action.type) {
    case 'RESET':
      return createInitialDriftLifecycleState(state.mode);
    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode,
      };
    case 'APPROVE_REMEDIATION':
      if (state.status !== 'awaiting_approval') return state;
      return startRemediation(
        appendEvent(state, {
          kind: 'human_approved',
          title: 'Human approval granted',
          detail: 'Operator approved remediation plan for controlled recovery.',
        })
      );
    case 'CANCEL_REMEDIATION':
      if (state.status !== 'awaiting_approval') return state;
      return appendEvent(
        {
          ...state,
          status: 'stable',
          metrics: METRICS.stable,
          remediationStep: 0,
          stableTicks: 0,
        },
        {
          kind: 'human_cancelled',
          title: 'Remediation canceled by operator',
          detail: 'Manual intervention deferred automatic changes; monitoring remains active.',
        }
      );
    case 'TICK': {
      if (state.status === 'stable') {
        const stableTicks = state.stableTicks + 1;
        if (stableTicks >= 3) return beginDriftDetection(state);
        return { ...state, stableTicks };
      }

      if (state.status === 'drift_detected') {
        if (state.mode === 'human') {
          return appendEvent(
            {
              ...state,
              status: 'awaiting_approval',
              metrics: METRICS.awaiting_approval,
            },
            {
              kind: 'awaiting_human_approval',
              title: 'Awaiting human approval',
              detail: 'Human-in-the-loop review required before remediation is applied.',
            }
          );
        }
        return startRemediation(state);
      }

      if (state.status === 'remediating') {
        if (state.remediationStep >= REMEDIATION_STEPS.length) {
          return completeStabilization(state);
        }
        const step = REMEDIATION_STEPS[state.remediationStep];
        return appendEvent(
          {
            ...state,
            remediationStep: state.remediationStep + 1,
            metrics: step.metrics,
          },
          step.event
        );
      }

      if (state.status === 'stabilized') {
        const stableTicks = state.stableTicks + 1;
        if (stableTicks >= 2) {
          return appendEvent(
            {
              ...state,
              status: 'stable',
              metrics: METRICS.stable,
              stableTicks: 0,
              remediationStep: 0,
            },
            {
              kind: 'monitoring_resumed',
              title: 'Monitoring resumed',
              detail: 'Baseline watch resumed after successful stabilization.',
            }
          );
        }
        return { ...state, stableTicks };
      }

      return state;
    }
    default:
      return state;
  }
}
