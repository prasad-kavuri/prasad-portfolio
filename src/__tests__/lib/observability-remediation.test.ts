import { describe, expect, it } from 'vitest';
import {
  createInitialDriftLifecycleState,
  driftLifecycleReducer,
} from '@/lib/observability-remediation';

describe('observability remediation lifecycle', () => {
  it('transitions stable -> drift_detected after deterministic ticks', () => {
    let state = createInitialDriftLifecycleState('auto');
    state = driftLifecycleReducer(state, { type: 'TICK' });
    state = driftLifecycleReducer(state, { type: 'TICK' });
    state = driftLifecycleReducer(state, { type: 'TICK' });

    expect(state.status).toBe('drift_detected');
    expect(state.metrics.driftScore).toBeGreaterThan(0.7);
    expect(state.events[0].kind).toBe('drift_detected');
  });

  it('transitions drift_detected -> remediating in auto mode', () => {
    let state = createInitialDriftLifecycleState('auto');
    state = driftLifecycleReducer(state, { type: 'TICK' });
    state = driftLifecycleReducer(state, { type: 'TICK' });
    state = driftLifecycleReducer(state, { type: 'TICK' });
    state = driftLifecycleReducer(state, { type: 'TICK' });

    expect(state.status).toBe('remediating');
    expect(state.events.some((event) => event.kind === 'fallback_engaged')).toBe(true);
  });

  it('transitions remediating -> stabilized', () => {
    let state = createInitialDriftLifecycleState('auto');
    for (let index = 0; index < 7; index += 1) {
      state = driftLifecycleReducer(state, { type: 'TICK' });
    }

    expect(state.status).toBe('stabilized');
    expect(state.events[0].kind).toBe('stabilized');
    expect(state.metrics.driftScore).toBeLessThan(0.2);
  });

  it('pauses for human approval and only remediates after approval', () => {
    let state = createInitialDriftLifecycleState('human');
    state = driftLifecycleReducer(state, { type: 'TICK' });
    state = driftLifecycleReducer(state, { type: 'TICK' });
    state = driftLifecycleReducer(state, { type: 'TICK' });
    state = driftLifecycleReducer(state, { type: 'TICK' });

    expect(state.status).toBe('awaiting_approval');

    const paused = driftLifecycleReducer(state, { type: 'TICK' });
    expect(paused.status).toBe('awaiting_approval');

    const approved = driftLifecycleReducer(state, { type: 'APPROVE_REMEDIATION' });
    expect(approved.status).toBe('remediating');
    expect(approved.events.some((event) => event.kind === 'human_approved')).toBe(true);
  });

  it('cancels human remediation and ignores approval actions outside approval state', () => {
    let state = createInitialDriftLifecycleState('human');
    for (let index = 0; index < 4; index += 1) {
      state = driftLifecycleReducer(state, { type: 'TICK' });
    }

    const cancelled = driftLifecycleReducer(state, { type: 'CANCEL_REMEDIATION' });
    expect(cancelled.status).toBe('stable');
    expect(cancelled.events[0].kind).toBe('human_cancelled');

    expect(driftLifecycleReducer(cancelled, { type: 'APPROVE_REMEDIATION' })).toBe(cancelled);
    expect(driftLifecycleReducer(cancelled, { type: 'CANCEL_REMEDIATION' })).toBe(cancelled);
  });

  it('resumes stable monitoring after stabilization and supports reset/mode changes', () => {
    let state = createInitialDriftLifecycleState('auto');
    state = driftLifecycleReducer(state, { type: 'SET_MODE', mode: 'human' });
    expect(state.mode).toBe('human');

    state = driftLifecycleReducer(state, { type: 'RESET' });
    expect(state.status).toBe('stable');
    expect(state.mode).toBe('human');

    state = createInitialDriftLifecycleState('auto');
    for (let index = 0; index < 7; index += 1) {
      state = driftLifecycleReducer(state, { type: 'TICK' });
    }
    expect(state.status).toBe('stabilized');

    state = driftLifecycleReducer(state, { type: 'TICK' });
    expect(state.status).toBe('stabilized');
    state = driftLifecycleReducer(state, { type: 'TICK' });
    expect(state.status).toBe('stable');
    expect(state.events[0].kind).toBe('monitoring_resumed');
  });
});
