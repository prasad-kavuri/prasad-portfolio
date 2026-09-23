import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { _resetDurableStore } from '@/lib/durable-store';
import { APPROVAL_TTL_S, createPendingApproval, decideApproval, hashPayload } from '@/lib/approvals';

describe('server-enforced approvals', () => {
  beforeEach(() => _resetDurableStore());
  afterEach(() => vi.useRealTimers());

  it('creates a pending approval bound to a hash of the staged payload', async () => {
    const pending = await createPendingApproval('edge-agent.cloud-handoff', { payload: 'x' }, 'trace-1');
    expect(pending.approvalId).toMatch(/^apr_[a-f0-9]{32}$/);
    expect(pending.payloadHash).toBe(await hashPayload({ payload: 'x' }));
    expect(new Date(pending.expiresAt).getTime() - new Date(pending.createdAt).getTime()).toBe(APPROVAL_TTL_S * 1000);
  });

  it('decides exactly once and reports replays as already_decided (409)', async () => {
    const pending = await createPendingApproval('multi-agent.release', { recommendation: 'r', target: 't' });
    const first = await decideApproval('multi-agent.release', pending.approvalId, 'approved');
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.receipt).toMatchObject({ decision: 'approved', payloadHash: pending.payloadHash });
      expect(first.pending.payload).toEqual({ recommendation: 'r', target: 't' });
    }
    expect(await decideApproval('multi-agent.release', pending.approvalId, 'approved')).toEqual({ ok: false, code: 'already_decided', status: 409 });
  });

  it('rejects malformed, unknown, expired, and cross-workflow ids', async () => {
    expect(await decideApproval('multi-agent.release', 42, 'approved')).toMatchObject({ code: 'invalid_id', status: 400 });
    expect(await decideApproval('multi-agent.release', 'apr_xyz', 'approved')).toMatchObject({ code: 'invalid_id' });
    expect(await decideApproval('multi-agent.release', `apr_${'c'.repeat(32)}`, 'approved')).toMatchObject({ code: 'not_found', status: 404 });

    const other = await createPendingApproval('edge-agent.cloud-handoff', { payload: 'p' });
    expect(await decideApproval('multi-agent.release', other.approvalId, 'approved')).toMatchObject({ code: 'kind_mismatch', status: 400 });
    // Fail safe: the misrouted approval is consumed and cannot be used afterwards.
    expect(await decideApproval('edge-agent.cloud-handoff', other.approvalId, 'approved')).toMatchObject({ ok: false });

    vi.useFakeTimers();
    const expiring = await createPendingApproval('edge-agent.cloud-handoff', { payload: 'p' });
    vi.setSystemTime(Date.now() + (APPROVAL_TTL_S + 1) * 1000);
    expect(await decideApproval('edge-agent.cloud-handoff', expiring.approvalId, 'approved')).toMatchObject({ code: 'not_found' });
  });
});
