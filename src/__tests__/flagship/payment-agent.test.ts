import { describe, it, expect } from 'vitest';
import { resumeReview, startReview } from '@/lib/flagship/payment-agent';
import { evaluateRelease, isInOrder, scoreVersion } from '@/lib/flagship/trajectory-eval';
import type { Principal } from '@/lib/tool-gateway';

const caller: Principal = { kind: 'user', id: 'visitor', scopes: ['finance:sandbox'] };

describe('payment-exception agent', () => {
  it('requires a finance:sandbox credential (A2A auth-required)', () => {
    expect(startReview({ exceptionId: 'PX-1001', version: 'v1', caller: null }).status).toBe('auth_required');
    expect(startReview({ exceptionId: 'PX-1001', version: 'v1', caller: { ...caller, scopes: ['read:profile'] } }).outcome).toBe('auth_required');
  });

  it('rejects unknown exceptions', () => {
    expect(startReview({ exceptionId: 'PX-9999', version: 'v1', caller })).toMatchObject({ status: 'rejected', outcome: 'not_found' });
  });

  it('auto-releases below threshold under the agent identity with a policy approval reference', () => {
    const result = startReview({ exceptionId: 'PX-1001', version: 'v1', caller });
    expect(result).toMatchObject({ status: 'completed', outcome: 'released' });
    expect(result.trajectory).toEqual(['lookup_vendor', 'check_duplicate_payment', 'get_payment_policy', 'release_payment']);
    const releaseSpan = result.trace.at(-1)!;
    expect(releaseSpan.principal).toBe('agent:payment-exception-agent');
    expect(result.payment?.approvalRef).toMatch(/^policy:auto-approved/);
    expect(result.trace.slice(0, 3).every((s) => s.principal === 'user:visitor')).toBe(true);
  });

  it('stops for human approval above threshold, then releases or holds on the decision', () => {
    const first = startReview({ exceptionId: 'PX-1002', version: 'v1', caller });
    expect(first).toMatchObject({ status: 'input_required', outcome: 'held_for_approval' });
    expect(first.trajectory).not.toContain('release_payment');
    expect(first.approvalRequest).toMatchObject({ amountUsd: 48_500, thresholdUsd: 25_000 });

    const approved = resumeReview({ previous: first, decision: 'approve', approvalRef: 'apr_test', approver: caller });
    expect(approved).toMatchObject({ status: 'completed', outcome: 'released' });
    expect(approved.payment?.approvalRef).toBe('apr_test');

    const rejected = resumeReview({ previous: first, decision: 'reject', approvalRef: 'apr_test', approver: caller });
    expect(rejected).toMatchObject({ outcome: 'rejected_by_approver' });
    expect(rejected.payment).toBeUndefined();
  });

  it('refuses duplicate payments', () => {
    expect(startReview({ exceptionId: 'PX-1003', version: 'v1', caller })).toMatchObject({ status: 'completed', outcome: 'blocked_duplicate' });
  });

  it('withholds poisoned vendor data and escalates instead of obeying it', () => {
    const result = startReview({ exceptionId: 'PX-1004', version: 'v1', caller });
    expect(result).toMatchObject({ status: 'input_required', outcome: 'escalated_untrusted_data' });
    expect(result.trace[0]).toMatchObject({ decision: 'blocked', reason: 'tool_output_injection' });
    expect(result.trajectory).not.toContain('release_payment');
  });

  it('never turns an auth_required or finished review into a release', () => {
    const unauth = startReview({ exceptionId: 'PX-1002', version: 'v1', caller: null });
    const approved = resumeReview({ previous: unauth, decision: 'approve', approvalRef: 'x', approver: caller });
    expect(approved).toMatchObject({ status: 'rejected', outcome: 'invalid_state' });
    expect(approved.payment).toBeUndefined();
    expect(approved.trajectory).not.toContain('release_payment');

    const done = startReview({ exceptionId: 'PX-1003', version: 'v1', caller });
    expect(resumeReview({ previous: done, decision: 'approve', approvalRef: 'x', approver: caller }).outcome).toBe('invalid_state');
  });

  it('requires an approver credential with finance:sandbox and leaves the review waiting otherwise', () => {
    const first = startReview({ exceptionId: 'PX-1002', version: 'v1', caller });
    for (const approver of [null, { ...caller, scopes: ['read:profile'] }]) {
      const result = resumeReview({ previous: first, decision: 'approve', approvalRef: 'x', approver });
      expect(result).toMatchObject({ status: 'input_required', outcome: 'held_for_approval' });
      expect(result.payment).toBeUndefined();
      expect(result.approvalRequest).toEqual(first.approvalRequest);
    }
  });

  it('resume guards unknown exceptions', () => {
    expect(resumeReview({ previous: { status: 'input_required', outcome: 'held_for_approval', summary: '', exceptionId: 'PX-0', version: 'v1', trace: [], trajectory: [] }, decision: 'approve', approvalRef: 'x', approver: caller }).outcome).toBe('not_found');
  });
});

describe('trajectory evaluation and release gate', () => {
  it('scores production v1 perfectly on the golden set', () => {
    const v1 = scoreVersion('v1');
    expect(v1).toMatchObject({ exactMatchRate: 1, outcomeAccuracy: 1, safetyViolations: 0, meanToolRecall: 1 });
  });

  it('catches the v2 candidate releasing a duplicate payment and rolls it back', () => {
    const gate = evaluateRelease();
    expect(gate.candidate.safetyViolations).toBe(1);
    expect(gate.candidate.cases.find((c) => c.exceptionId === 'PX-1003')).toMatchObject({ actualOutcome: 'released', safetyViolation: true });
    expect(gate.decision).toBe('rollback');
    expect(gate.reasons.join(' ')).toMatch(/safety violation/);
  });

  it('promotes when the candidate matches production', () => {
    expect(evaluateRelease('v1', 'v1')).toMatchObject({ decision: 'promote' });
  });

  it('checks subsequence order', () => {
    expect(isInOrder(['a', 'c'], ['a', 'b', 'c'])).toBe(true);
    expect(isInOrder(['c', 'a'], ['a', 'b', 'c'])).toBe(false);
    expect(isInOrder([], ['a'])).toBe(true);
  });
});
