import { describe, expect, it } from 'vitest';
import { INITIAL_ORCHESTRATION_STATE } from '@/lib/agents/handoff-model';
import { orchestrationReducer } from '@/lib/agents/orchestration';

describe('orchestrationReducer', () => {
  it('START_WORKFLOW sets running status and logs workflow_started', () => {
    const next = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-1' });

    expect(next.status).toBe('running');
    expect(next.traceId).toBe('trace-1');
    expect(next.auditLog.at(-1)?.eventType).toBe('workflow_started');
  });

  it('REQUEST_HANDOFF valid destination appends pending handoff', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-2' });
    const next = orchestrationReducer(started, {
      type: 'REQUEST_HANDOFF',
      from: 'analyzer',
      to: 'researcher',
      reason: 'handoff',
      contextSummary: 'analysis complete',
    });

    expect(next.handoffs).toHaveLength(1);
    expect(next.handoffs[0].status).toBe('pending');
    expect(next.auditLog.at(-1)?.eventType).toBe('handoff_requested');
  });

  it('REQUEST_HANDOFF invalid destination gets blocked and logs handoff_blocked', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-3' });
    const next = orchestrationReducer(started, {
      type: 'REQUEST_HANDOFF',
      from: 'analyzer',
      to: 'synthesizer',
      reason: 'invalid',
      contextSummary: 'invalid transfer',
    });

    expect(next.handoffs[0].status).toBe('blocked');
    expect(next.auditLog.at(-1)?.eventType).toBe('handoff_blocked');
  });

  it('REQUEST_APPROVAL sets awaiting-approval and logs approval_requested', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-4' });
    const requested = orchestrationReducer(started, {
      type: 'REQUEST_HANDOFF',
      from: 'strategist',
      to: 'hitl',
      reason: 'review gate',
      contextSummary: 'high impact recommendation',
    });
    const accepted = orchestrationReducer(requested, { type: 'ACCEPT_HANDOFF', handoffId: requested.handoffs[0].id });
    const next = orchestrationReducer(accepted, { type: 'REQUEST_APPROVAL', handoffId: accepted.handoffs[0].id });

    expect(next.status).toBe('awaiting-approval');
    expect(next.auditLog.at(-1)?.eventType).toBe('approval_requested');
  });

  it('GRANT_APPROVAL returns to running and logs approval_granted', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-5' });
    const requested = orchestrationReducer(started, {
      type: 'REQUEST_HANDOFF',
      from: 'strategist',
      to: 'hitl',
      reason: 'review gate',
      contextSummary: 'high impact recommendation',
    });
    const accepted = orchestrationReducer(requested, { type: 'ACCEPT_HANDOFF', handoffId: requested.handoffs[0].id });
    const awaiting = orchestrationReducer(accepted, { type: 'REQUEST_APPROVAL', handoffId: accepted.handoffs[0].id });
    const next = orchestrationReducer(awaiting, { type: 'GRANT_APPROVAL', handoffId: awaiting.handoffs[0].id });

    expect(next.status).toBe('running');
    expect(next.auditLog.at(-1)?.eventType).toBe('approval_granted');
  });

  it('DENY_APPROVAL logs approval_denied and preserves prior activeAgent state', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-6' });
    const requested = orchestrationReducer(started, {
      type: 'REQUEST_HANDOFF',
      from: 'strategist',
      to: 'hitl',
      reason: 'review gate',
      contextSummary: 'high impact recommendation',
    });
    const accepted = orchestrationReducer(requested, { type: 'ACCEPT_HANDOFF', handoffId: requested.handoffs[0].id });
    const awaiting = orchestrationReducer(accepted, { type: 'REQUEST_APPROVAL', handoffId: accepted.handoffs[0].id });
    const next = orchestrationReducer(awaiting, { type: 'DENY_APPROVAL', handoffId: awaiting.handoffs[0].id });

    expect(next.activeAgent).toBe(awaiting.activeAgent);
    expect(next.auditLog.at(-1)?.eventType).toBe('approval_denied');
  });

  it('COMPLETE_WORKFLOW sets completed and logs workflow_completed', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-7' });
    const next = orchestrationReducer(started, { type: 'COMPLETE_WORKFLOW' });

    expect(next.status).toBe('completed');
    expect(next.auditLog.at(-1)?.eventType).toBe('workflow_completed');
  });

  it('illegal transition appends workflow_failed warn and keeps state operational', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-8' });
    const next = orchestrationReducer(started, { type: 'GRANT_APPROVAL', handoffId: 'missing' });

    expect(next.status).toBe(started.status);
    expect(next.auditLog.at(-1)?.eventType).toBe('workflow_failed');
    expect(next.auditLog.at(-1)?.severity).toBe('warn');
  });

  it('version increments on every valid state change', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-9' });
    const activated = orchestrationReducer(started, { type: 'ACTIVATE_AGENT', agentId: 'analyzer' });
    const completed = orchestrationReducer(activated, { type: 'COMPLETE_AGENT', agentId: 'analyzer' });

    expect(started.version).toBeGreaterThan(INITIAL_ORCHESTRATION_STATE.version);
    expect(activated.version).toBeGreaterThan(started.version);
    expect(completed.version).toBeGreaterThan(activated.version);
  });

  it('is deterministic for identical input and action', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-10' });
    const action = {
      type: 'REQUEST_HANDOFF' as const,
      from: 'analyzer' as const,
      to: 'researcher' as const,
      reason: 'same input',
      contextSummary: 'same summary',
    };

    const first = orchestrationReducer(started, action);
    const second = orchestrationReducer(started, action);

    expect(first).toEqual(second);
  });

  it('supports ACCEPT_HANDOFF from approved status and resets awaiting-approval state', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-11' });
    const requested = orchestrationReducer(started, {
      type: 'REQUEST_HANDOFF',
      from: 'strategist',
      to: 'hitl',
      reason: 'review gate',
      contextSummary: 'handoff',
    });
    const accepted = orchestrationReducer(requested, { type: 'ACCEPT_HANDOFF', handoffId: requested.handoffs[0].id });
    const awaiting = orchestrationReducer(accepted, { type: 'REQUEST_APPROVAL', handoffId: accepted.handoffs[0].id });
    const approved = orchestrationReducer(awaiting, { type: 'GRANT_APPROVAL', handoffId: awaiting.handoffs[0].id });
    const reaccepted = orchestrationReducer(approved, { type: 'ACCEPT_HANDOFF', handoffId: approved.handoffs[0].id });

    expect(reaccepted.status).toBe('running');
    expect(reaccepted.activeAgent).toBe('hitl');
  });

  it('handles BLOCK_HANDOFF unknown handoff as illegal transition', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-12' });
    const next = orchestrationReducer(started, { type: 'BLOCK_HANDOFF', handoffId: 'missing', reason: 'missing handoff' });

    expect(next.auditLog.at(-1)?.eventType).toBe('workflow_failed');
  });

  it('flags REQUEST_APPROVAL without accepted handoff as illegal', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-13' });
    const next = orchestrationReducer(started, { type: 'REQUEST_APPROVAL', handoffId: 'missing' });

    expect(next.auditLog.at(-1)?.eventType).toBe('workflow_failed');
  });

  it('flags DENY_APPROVAL outside awaiting-approval window as illegal', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-14' });
    const next = orchestrationReducer(started, { type: 'DENY_APPROVAL', handoffId: 'missing' });

    expect(next.auditLog.at(-1)?.eventType).toBe('workflow_failed');
  });

  it('flags COMPLETE_AGENT for inactive agent as illegal', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-15' });
    const next = orchestrationReducer(started, { type: 'COMPLETE_AGENT', agentId: 'researcher' });

    expect(next.auditLog.at(-1)?.eventType).toBe('workflow_failed');
  });

  it('converts accepted and approved handoffs to completed on COMPLETE_WORKFLOW', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-16' });
    const h1 = orchestrationReducer(started, {
      type: 'REQUEST_HANDOFF',
      from: 'analyzer',
      to: 'researcher',
      reason: 'handoff',
      contextSummary: 'context',
    });
    const accepted = orchestrationReducer(h1, { type: 'ACCEPT_HANDOFF', handoffId: h1.handoffs[0].id });
    const h2 = orchestrationReducer(accepted, {
      type: 'REQUEST_HANDOFF',
      from: 'strategist',
      to: 'hitl',
      reason: 'approval',
      contextSummary: 'context',
    });
    const acceptedApproval = orchestrationReducer(h2, { type: 'ACCEPT_HANDOFF', handoffId: h2.handoffs[1].id });
    const awaiting = orchestrationReducer(acceptedApproval, { type: 'REQUEST_APPROVAL', handoffId: h2.handoffs[1].id });
    const approved = orchestrationReducer(awaiting, { type: 'GRANT_APPROVAL', handoffId: h2.handoffs[1].id });
    const completed = orchestrationReducer(approved, { type: 'COMPLETE_WORKFLOW' });

    expect(completed.handoffs.every((handoff) => ['completed', 'pending', 'blocked', 'denied'].includes(handoff.status))).toBe(true);
    expect(completed.auditLog.at(-1)?.eventType).toBe('workflow_completed');
  });

  it('fails COMPLETE_WORKFLOW if state is not running', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-17' });
    const failed = orchestrationReducer(started, { type: 'FAIL_WORKFLOW', reason: 'failure' });
    const next = orchestrationReducer(failed, { type: 'COMPLETE_WORKFLOW' });

    expect(next.auditLog.at(-1)?.eventType).toBe('workflow_failed');
  });

  it('sets failed status on FAIL_WORKFLOW', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-18' });
    const next = orchestrationReducer(started, { type: 'FAIL_WORKFLOW', reason: 'explicit failure' });

    expect(next.status).toBe('failed');
    expect(next.auditLog.at(-1)?.description).toContain('explicit failure');
  });

  it('returns state for unknown action shape fallback', () => {
    const started = orchestrationReducer(INITIAL_ORCHESTRATION_STATE, { type: 'START_WORKFLOW', traceId: 'trace-19' });
    const next = orchestrationReducer(started, { type: 'UNKNOWN' } as never);

    expect(next).toEqual(started);
  });
});
