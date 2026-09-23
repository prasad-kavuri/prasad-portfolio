/**
 * Server-enforced human approval (SPEC-0020).
 *
 * A consequential action is staged server-side as a pending approval with a random, unguessable id.
 * The action can only proceed through `decideApproval`, which atomically consumes the pending record
 * (single use), rejects replays, expires after APPROVAL_TTL_S, and returns a receipt that binds the
 * decision to a hash of exactly what was staged. The client never gets to assert "approved" on its own.
 *
 * Public-demo caveat: the visitor plays the approver. In production the approver would be an
 * authenticated principal distinct from the requester — that identity binding is out of scope here.
 */
import { kvGetJson, kvSetJson, kvTakeJson } from '@/lib/durable-store';

export const APPROVAL_TTL_S = 15 * 60;
const RECEIPT_TTL_S = 24 * 60 * 60;

export type ApprovalKind = 'multi-agent.release' | 'edge-agent.cloud-handoff';
export type ApprovalDecision = 'approved' | 'rejected';

export interface PendingApproval<T> {
  approvalId: string;
  kind: ApprovalKind;
  payload: T;
  payloadHash: string;
  createdAt: string;
  expiresAt: string;
  traceId?: string;
}

export interface ApprovalReceipt {
  approvalId: string;
  kind: ApprovalKind;
  decision: ApprovalDecision;
  payloadHash: string;
  createdAt: string;
  decidedAt: string;
}

export type DecideResult<T> =
  | { ok: true; pending: PendingApproval<T>; receipt: ApprovalReceipt }
  | { ok: false; code: 'invalid_id' | 'not_found' | 'already_decided' | 'kind_mismatch'; status: 400 | 404 | 409 };

const APPROVAL_ID_RE = /^apr_[a-f0-9]{32}$/;

function newApprovalId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `apr_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function hashPayload(payload: unknown): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const pendingKey = (id: string) => `approval:pending:${id}`;
const receiptKey = (id: string) => `approval:receipt:${id}`;

export async function createPendingApproval<T>(
  kind: ApprovalKind,
  payload: T,
  traceId?: string,
): Promise<PendingApproval<T>> {
  const now = Date.now();
  const pending: PendingApproval<T> = {
    approvalId: newApprovalId(),
    kind,
    payload,
    payloadHash: await hashPayload(payload),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + APPROVAL_TTL_S * 1000).toISOString(),
    traceId,
  };
  await kvSetJson(pendingKey(pending.approvalId), pending, APPROVAL_TTL_S);
  return pending;
}

/**
 * Consume a pending approval exactly once. Unknown and expired ids are indistinguishable (404);
 * an id that was already decided returns 409 so replays are visible.
 */
export async function decideApproval<T>(
  kind: ApprovalKind,
  approvalId: unknown,
  decision: ApprovalDecision,
): Promise<DecideResult<T>> {
  if (typeof approvalId !== 'string' || !APPROVAL_ID_RE.test(approvalId)) {
    return { ok: false, code: 'invalid_id', status: 400 };
  }

  const pending = await kvTakeJson<PendingApproval<T>>(pendingKey(approvalId));
  if (!pending) {
    const priorReceipt = await kvGetJson<ApprovalReceipt>(receiptKey(approvalId));
    return priorReceipt
      ? { ok: false, code: 'already_decided', status: 409 }
      : { ok: false, code: 'not_found', status: 404 };
  }

  // A pending record consumed through the wrong route stays consumed (fail safe).
  if (pending.kind !== kind) {
    return { ok: false, code: 'kind_mismatch', status: 400 };
  }

  const receipt: ApprovalReceipt = {
    approvalId,
    kind,
    decision,
    payloadHash: pending.payloadHash,
    createdAt: pending.createdAt,
    decidedAt: new Date().toISOString(),
  };
  await kvSetJson(receiptKey(approvalId), receipt, RECEIPT_TTL_S);
  return { ok: true, pending, receipt };
}

export const APPROVAL_ERROR_MESSAGES: Record<'invalid_id' | 'not_found' | 'already_decided' | 'kind_mismatch', string> = {
  invalid_id: 'Invalid approval id',
  not_found: 'Approval not found or expired — rerun the workflow',
  already_decided: 'This approval was already decided and cannot be reused',
  kind_mismatch: 'Approval id does not belong to this workflow',
};
