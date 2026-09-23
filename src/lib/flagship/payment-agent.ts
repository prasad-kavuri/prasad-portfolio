/**
 * Payment-exception review agent — the specialist behind the Governed Agent Platform flagship
 * (SPEC-0021). Pure, deterministic logic (no model calls) so every run is reproducible, testable,
 * and free to operate. All data is synthetic (src/data/flagship-scenarios.ts).
 *
 * Identity model, mirroring enterprise agent platforms:
 *   - reads run on the caller's delegated credential (user principal, scope `finance:sandbox`);
 *   - `release_payment` runs under the agent's own service identity (`payments:release`) and the
 *     gateway additionally requires a recorded approval reference.
 */
import {
  getPaymentException,
  PAID_INVOICES,
  PAYMENT_POLICIES,
  VENDORS,
  type PaymentException,
} from '@/data/flagship-scenarios';
import { invokeTool, type Principal, type ToolExecutor, type ToolSpan } from '@/lib/tool-gateway';
import { FINANCE_TOOL_POLICIES } from '@/lib/tool-policy';

export type AgentVersion = 'v1' | 'v2-candidate';

export const AGENT_VERSIONS: Record<AgentVersion, { label: string; change: string }> = {
  v1: { label: 'v1 (production)', change: 'Baseline policy: vendor → duplicate check → policy → release.' },
  'v2-candidate': {
    label: 'v2 (candidate)',
    change: 'Latency optimization: skips the duplicate-payment check. Looks harmless; evaluation decides.',
  },
};

export const AGENT_SERVICE_PRINCIPAL: Principal = {
  kind: 'agent',
  id: 'payment-exception-agent',
  scopes: ['finance:sandbox', 'payments:release'],
};

export type ReviewOutcome =
  | 'released'
  | 'held_for_approval'
  | 'blocked_duplicate'
  | 'escalated_untrusted_data'
  | 'rejected_by_approver'
  | 'auth_required'
  | 'invalid_state'
  | 'not_found';

export type ReviewStatus = 'completed' | 'input_required' | 'auth_required' | 'rejected';

export interface ApprovalRequest {
  exceptionId: string;
  amountUsd: number;
  thresholdUsd: number | null;
  reason: string;
}

export interface ReviewResult {
  status: ReviewStatus;
  outcome: ReviewOutcome;
  summary: string;
  version: AgentVersion;
  exceptionId: string;
  trace: ToolSpan[];
  /** Tool names in the order the agent attempted them (including denied/blocked calls). */
  trajectory: string[];
  approvalRequest?: ApprovalRequest;
  payment?: { paymentRef: string; exceptionId: string; amountUsd: number; approvalRef: string };
}

const FINANCE_EXECUTORS: Record<string, ToolExecutor> = {
  lookup_vendor: (args) => {
    const vendor = VENDORS[String(args.vendorId ?? '')];
    return vendor ? JSON.stringify(vendor) : 'Vendor not found';
  },
  check_duplicate_payment: (args) =>
    JSON.stringify({ invoiceId: String(args.invoiceId ?? ''), alreadyPaid: PAID_INVOICES.has(String(args.invoiceId ?? '')) }),
  get_payment_policy: (args) => {
    const policy = PAYMENT_POLICIES[String(args.category ?? '') as PaymentException['category']];
    return policy ? JSON.stringify(policy) : 'Policy not found';
  },
  release_payment: (args) =>
    JSON.stringify({
      paymentRef: `PAY-${String(args.exceptionId ?? '').replace(/[^A-Z0-9-]/g, '')}-SANDBOX`,
      exceptionId: String(args.exceptionId ?? ''),
      status: 'released (sandbox — no money moves)',
    }),
};

class Run {
  readonly trace: ToolSpan[] = [];
  readonly trajectory: string[] = [];

  call(tool: string, args: Record<string, unknown>, principal: Principal, approvalRef?: string) {
    this.trajectory.push(tool);
    const invocation = invokeTool({
      tool,
      args,
      principal,
      policies: FINANCE_TOOL_POLICIES,
      executors: FINANCE_EXECUTORS,
      approvalRef,
    });
    this.trace.push(invocation.span);
    return invocation;
  }
}

function release(run: Run, exception: PaymentException, approvalRef: string) {
  const invocation = run.call('release_payment', { exceptionId: exception.exceptionId }, AGENT_SERVICE_PRINCIPAL, approvalRef);
  if (invocation.decision !== 'allowed') return undefined;
  const receipt = JSON.parse(invocation.result) as { paymentRef: string };
  return { paymentRef: receipt.paymentRef, exceptionId: exception.exceptionId, amountUsd: exception.amountUsd, approvalRef };
}

/** First turn of a review. Stops at `input_required` when a human decision is needed. */
export function startReview(params: { exceptionId: string; version: AgentVersion; caller: Principal | null }): ReviewResult {
  const { exceptionId, version, caller } = params;
  const base = { version, exceptionId, trace: [] as ToolSpan[], trajectory: [] as string[] };

  if (!caller || !caller.scopes.includes('finance:sandbox')) {
    return {
      ...base,
      status: 'auth_required',
      outcome: 'auth_required',
      summary: 'A credential with the finance:sandbox scope is required. Obtain one via /auth.md and send it as a Bearer token.',
    };
  }

  const exception = getPaymentException(exceptionId);
  if (!exception) {
    return { ...base, status: 'rejected', outcome: 'not_found', summary: `Unknown payment exception ${exceptionId}.` };
  }

  const run = new Run();
  const done = (partial: Omit<ReviewResult, 'version' | 'exceptionId' | 'trace' | 'trajectory'>): ReviewResult => ({
    ...partial,
    version,
    exceptionId,
    trace: run.trace,
    trajectory: run.trajectory,
  });

  const vendor = run.call('lookup_vendor', { vendorId: exception.vendorId }, caller);
  if (vendor.decision === 'blocked') {
    return done({
      status: 'input_required',
      outcome: 'escalated_untrusted_data',
      summary: 'The vendor record contained instructions aimed at the agent. The gateway withheld it; a human must review before any payment.',
      approvalRequest: {
        exceptionId,
        amountUsd: exception.amountUsd,
        thresholdUsd: null,
        reason: 'Untrusted content detected in the vendor record',
      },
    });
  }

  if (version !== 'v2-candidate') {
    const duplicate = run.call('check_duplicate_payment', { invoiceId: exception.invoiceId }, caller);
    if (duplicate.decision === 'allowed' && (JSON.parse(duplicate.result) as { alreadyPaid: boolean }).alreadyPaid) {
      return done({
        status: 'completed',
        outcome: 'blocked_duplicate',
        summary: `Invoice ${exception.invoiceId} was already paid. The agent refused to release a duplicate payment.`,
      });
    }
  }

  const policyCall = run.call('get_payment_policy', { category: exception.category }, caller);
  const policy = JSON.parse(policyCall.result) as { approvalThresholdUsd: number };

  if (exception.amountUsd > policy.approvalThresholdUsd) {
    return done({
      status: 'input_required',
      outcome: 'held_for_approval',
      summary: `$${exception.amountUsd.toLocaleString('en-US')} exceeds the ${exception.category} approval threshold of $${policy.approvalThresholdUsd.toLocaleString('en-US')}. Waiting for a human decision.`,
      approvalRequest: {
        exceptionId,
        amountUsd: exception.amountUsd,
        thresholdUsd: policy.approvalThresholdUsd,
        reason: 'Amount exceeds the policy approval threshold',
      },
    });
  }

  const payment = release(run, exception, `policy:auto-approved-under-${policy.approvalThresholdUsd}`);
  return done({
    status: 'completed',
    outcome: 'released',
    summary: `Released under policy auto-approval (below $${policy.approvalThresholdUsd.toLocaleString('en-US')}).`,
    payment,
  });
}

/**
 * Second turn: apply a human decision to a review that stopped at `input_required`.
 *
 * Fail-closed rules:
 *  - only a review that is actually awaiting approval can be decided (an `auth_required`
 *    or finished review can never be "approved" into a release);
 *  - the approver must present a credential with the finance:sandbox scope — an
 *    unauthenticated decision leaves the review waiting, unchanged.
 */
export function resumeReview(params: {
  previous: Pick<ReviewResult, 'status' | 'exceptionId' | 'version' | 'trace' | 'trajectory' | 'approvalRequest' | 'summary' | 'outcome'>;
  decision: 'approve' | 'reject';
  approvalRef: string;
  approver: Principal | null;
}): ReviewResult {
  const { previous } = params;
  const exception = getPaymentException(previous.exceptionId);
  const run = new Run();
  run.trace.push(...previous.trace);
  run.trajectory.push(...previous.trajectory);
  const base = { version: previous.version, exceptionId: previous.exceptionId, trace: run.trace, trajectory: run.trajectory };

  if (previous.status !== 'input_required') {
    return {
      ...base,
      status: 'rejected',
      outcome: 'invalid_state',
      summary: 'Only a review that is awaiting approval can be approved or rejected. Start a new review with a credential that has the finance:sandbox scope.',
    };
  }
  if (!params.approver || !params.approver.scopes.includes('finance:sandbox')) {
    return {
      ...base,
      status: 'input_required',
      outcome: previous.outcome,
      summary: 'An approver credential with the finance:sandbox scope is required to decide this review. Nothing was released.',
      approvalRequest: previous.approvalRequest,
    };
  }
  if (!exception) {
    return { ...base, status: 'rejected', outcome: 'not_found', summary: 'Unknown payment exception.' };
  }
  if (params.decision === 'reject') {
    return { ...base, status: 'completed', outcome: 'rejected_by_approver', summary: 'The approver rejected the payment. Nothing was released.' };
  }
  const payment = release(run, exception, params.approvalRef);
  return {
    ...base,
    status: 'completed',
    outcome: 'released',
    summary: `Released after human approval (${params.approvalRef}).`,
    payment,
  };
}
