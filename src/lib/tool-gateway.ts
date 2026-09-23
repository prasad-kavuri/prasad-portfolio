/**
 * Tool gateway (SPEC-0021): the single enforcement point every agent tool call passes through.
 *
 * For each call it (1) authorizes the caller's principal against the tool's policy — default deny,
 * required scope, and recorded approval for consequential actions; (2) executes the tool;
 * (3) screens the output for injected instructions before any model or agent sees it; and
 * (4) emits a trace span. This mirrors the role an agent gateway plays in enterprise agent
 * platforms (identity-aware, per-tool policy, runtime content screening, telemetry).
 */
import { BLOCKED_TOOL_OUTPUT, screenToolOutput } from '@/lib/guardrails';
import { authorizeToolCall, deniedToolResult, type ToolPolicy } from '@/lib/tool-policy';

export interface Principal {
  /** 'user' = acting on a caller's delegated credential; 'agent' = the agent's own service identity. */
  kind: 'user' | 'agent';
  id: string;
  scopes: readonly string[];
}

export type ToolDecision = 'allowed' | 'denied' | 'blocked';

export interface ToolSpan {
  spanId: string;
  tool: string;
  principal: string;
  decision: ToolDecision;
  reason?: string;
  startedAt: string;
  durationMs: number;
}

export interface ToolInvocation {
  decision: ToolDecision;
  result: string;
  span: ToolSpan;
}

export type ToolExecutor = (args: Record<string, unknown>) => string;

export function invokeTool(params: {
  tool: string;
  args: Record<string, unknown>;
  principal: Principal;
  policies: Record<string, ToolPolicy>;
  executors: Record<string, ToolExecutor>;
  approvalRef?: string | null;
}): ToolInvocation {
  const started = Date.now();
  const spanBase = {
    spanId: `span_${Math.random().toString(16).slice(2, 10)}`,
    tool: params.tool,
    principal: `${params.principal.kind}:${params.principal.id}`,
    startedAt: new Date(started).toISOString(),
  };

  const auth = authorizeToolCall(params.tool, params.principal.scopes, {
    policies: params.policies,
    approvalRef: params.approvalRef,
  });
  const executor = Object.prototype.hasOwnProperty.call(params.executors, params.tool) ? params.executors[params.tool] : undefined;
  if (!auth.allowed || !executor) {
    const denial = auth.allowed ? ({ allowed: false, reason: 'unknown_tool' } as const) : auth;
    return {
      decision: 'denied',
      result: deniedToolResult(params.tool, denial),
      span: { ...spanBase, decision: 'denied', reason: denial.reason, durationMs: Date.now() - started },
    };
  }

  const raw = executor(params.args);
  const screening = screenToolOutput(raw);
  const decision: ToolDecision = screening.safe ? 'allowed' : 'blocked';
  return {
    decision,
    result: screening.safe ? raw : BLOCKED_TOOL_OUTPUT,
    span: {
      ...spanBase,
      decision,
      ...(screening.safe ? {} : { reason: 'tool_output_injection' }),
      durationMs: Date.now() - started,
    },
  };
}
