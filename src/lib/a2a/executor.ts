/**
 * A2A executor for the portfolio agent (SPEC-0021).
 *
 *   - profile-brief: answered immediately with a Message (no task).
 *   - payment-exception-review: a Task that moves SUBMITTED → (AUTH_REQUIRED | INPUT_REQUIRED |
 *     COMPLETED | REJECTED). A task paused in INPUT_REQUIRED resumes when the client sends
 *     {"decision":"approve"|"reject"} on the same taskId; once terminal, the SDK rejects further
 *     messages, so an approval can never be replayed.
 *
 * Review state (trace, trajectory) is carried in task.metadata.review and persisted by the
 * durable TaskStore between invocations.
 */
import { randomUUID } from 'node:crypto';
import type { Message, Part, Task } from '@a2a-js/sdk';
import { Role, TaskState } from '@a2a-js/sdk';
import { AgentEvent, type AgentExecutor, type ExecutionEventBus, type RequestContext, type User } from '@a2a-js/sdk/server';
import profile from '@/data/profile.json';
import { resumeReview, startReview, type ReviewResult } from '@/lib/flagship/payment-agent';
import type { Principal } from '@/lib/tool-gateway';

/** Caller identity resolved from the Bearer credential by the route. */
export class ScopedUser implements User {
  constructor(readonly principal: Principal) {}
  get isAuthenticated(): boolean {
    return true;
  }
  get userName(): string {
    return this.principal.id;
  }
}

const dataPart = (value: unknown): Part => ({ content: { $case: 'data', value }, metadata: undefined, filename: '', mediaType: 'application/json' });
const textPart = (value: string): Part => ({ content: { $case: 'text', value }, metadata: undefined, filename: '', mediaType: 'text/plain' });

function agentMessage(rc: RequestContext, parts: Part[], taskId = ''): Message {
  return {
    messageId: randomUUID(),
    contextId: rc.contextId,
    taskId,
    role: Role.ROLE_AGENT,
    parts,
    metadata: undefined,
    extensions: [],
    referenceTaskIds: [],
  };
}

export interface ParsedInput {
  exceptionId?: string;
  decision?: 'approve' | 'reject';
  text: string;
}

export function parseInput(message: Message): ParsedInput {
  const parsed: ParsedInput = { text: '' };
  for (const part of message.parts ?? []) {
    const content = part.content;
    if (content?.$case === 'text') parsed.text += `${content.value} `;
    if (content?.$case === 'data' && content.value && typeof content.value === 'object') {
      const data = content.value as Record<string, unknown>;
      if (typeof data.exceptionId === 'string') parsed.exceptionId = data.exceptionId.toUpperCase();
      if (data.decision === 'approve' || data.decision === 'reject') parsed.decision = data.decision;
    }
  }
  if (!parsed.exceptionId) {
    const match = parsed.text.match(/\bPX-\d{4}\b/i);
    if (match) parsed.exceptionId = match[0].toUpperCase();
  }
  if (!parsed.decision) {
    if (/\bapprove\b/i.test(parsed.text)) parsed.decision = 'approve';
    else if (/\breject\b/i.test(parsed.text)) parsed.decision = 'reject';
  }
  return parsed;
}

export function profileBrief() {
  const current = profile.experience[0];
  return {
    name: 'Prasad Kavuri',
    currentRole: { title: current.title, company: current.company, period: current.period },
    priorRoles: profile.experience.slice(1, 5).map((e) => ({ title: e.title, company: e.company, period: e.period })),
    headlineOutcomes: [
      '50% latency reduction and 40% cost savings at Krutrim (multimodal agentic architecture + intelligent model routing)',
      '70% infrastructure cost reduction at Ola (cloud-native architectural overhaul)',
      '200+ engineers led across the US, Europe, and India',
    ],
    links: { portfolio: 'https://www.prasadkavuri.com', mcp: 'https://www.prasadkavuri.com/api/mcp' },
  };
}

const STATE_FOR: Record<ReviewResult['status'], TaskState> = {
  completed: TaskState.TASK_STATE_COMPLETED,
  input_required: TaskState.TASK_STATE_INPUT_REQUIRED,
  auth_required: TaskState.TASK_STATE_AUTH_REQUIRED,
  rejected: TaskState.TASK_STATE_REJECTED,
};

function publishReview(rc: RequestContext, bus: ExecutionEventBus, baseTask: Task, result: ReviewResult) {
  const now = new Date().toISOString();
  bus.publish(AgentEvent.task({ ...baseTask, metadata: { ...(baseTask.metadata ?? {}), review: result } }));

  if (result.status === 'completed') {
    bus.publish(
      AgentEvent.artifactUpdate({
        taskId: rc.taskId,
        contextId: rc.contextId,
        artifact: {
          artifactId: randomUUID(),
          name: 'review-result',
          description: 'Outcome, trajectory, and gateway trace of the payment-exception review',
          parts: [dataPart({ outcome: result.outcome, summary: result.summary, payment: result.payment ?? null, trajectory: result.trajectory, trace: result.trace })],
          metadata: undefined,
          extensions: [],
        },
        append: false,
        lastChunk: true,
        metadata: undefined,
      }),
    );
  }

  const statusParts: Part[] = [textPart(result.summary)];
  if (result.approvalRequest) statusParts.push(dataPart({ approvalRequest: result.approvalRequest, respondWith: { decision: 'approve | reject' } }));
  bus.publish(
    AgentEvent.statusUpdate({
      taskId: rc.taskId,
      contextId: rc.contextId,
      status: { state: STATE_FOR[result.status], message: agentMessage(rc, statusParts, rc.taskId), timestamp: now },
      metadata: undefined,
    }),
  );
}

export class PortfolioAgentExecutor implements AgentExecutor {
  async execute(rc: RequestContext, bus: ExecutionEventBus): Promise<void> {
    const input = parseInput(rc.userMessage);
    const caller = rc.context.user instanceof ScopedUser ? rc.context.user.principal : null;

    if (rc.task) {
      const previous = rc.task.metadata?.review as ReviewResult | undefined;
      if (!previous || !input.decision) {
        // Still waiting: restate what is needed without changing state.
        bus.publish(AgentEvent.task(rc.task));
        bus.publish(
          AgentEvent.statusUpdate({
            taskId: rc.taskId,
            contextId: rc.contextId,
            status: {
              state: rc.task.status?.state ?? TaskState.TASK_STATE_INPUT_REQUIRED,
              message: agentMessage(rc, [textPart('Send {"decision":"approve"} or {"decision":"reject"} to continue this task.')], rc.taskId),
              timestamp: new Date().toISOString(),
            },
            metadata: undefined,
          }),
        );
        bus.finished();
        return;
      }
      const result = resumeReview({
        previous,
        decision: input.decision,
        approvalRef: `a2a:${rc.taskId}:${rc.userMessage.messageId}`,
        approver: caller,
      });
      publishReview(rc, bus, rc.task, result);
      bus.finished();
      return;
    }

    if (!input.exceptionId) {
      bus.publish(AgentEvent.message(agentMessage(rc, [dataPart(profileBrief())])));
      bus.finished();
      return;
    }

    const task: Task = {
      id: rc.taskId,
      contextId: rc.contextId,
      status: { state: TaskState.TASK_STATE_SUBMITTED, message: undefined, timestamp: new Date().toISOString() },
      artifacts: [],
      history: [rc.userMessage],
      metadata: { skill: 'payment-exception-review' },
    };
    const result = startReview({ exceptionId: input.exceptionId, version: 'v1', caller });
    publishReview(rc, bus, task, result);
    bus.finished();
  }

  async cancelTask(): Promise<void> {
    // Reviews are synchronous per turn; there is no in-flight work to cancel.
  }
}
