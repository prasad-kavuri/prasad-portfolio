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
});
