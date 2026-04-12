import { logAPIEvent } from '@/lib/observability';

export const MAX_TOKENS_PER_REQUEST = 1_500;
export const MAX_COST_REQUESTS_PER_MINUTE = 20;
export const DEFAULT_FALLBACK_MODEL = 'llama-3.1-8b-instant';

interface CostWindow {
  count: number;
  resetAt: number;
}

export interface CostControlInput {
  route: string;
  userKey: string;
  prompt: string;
  requestedModel?: string;
  maxTokens?: number;
}

export interface CostControlResult {
  allowed: boolean;
  reason?: 'token_limit' | 'request_frequency';
  estimatedTokens: number;
  fallbackModel?: string;
}

const requestWindows = new Map<string, CostWindow>();

export function estimateTokens(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  return Math.ceil(normalized.length / 4);
}

export function selectCostAwareModel(requestedModel?: string, estimatedTokens = 0): string | undefined {
  if (!requestedModel) return undefined;
  if (requestedModel.includes('70b') && estimatedTokens > 350) {
    return DEFAULT_FALLBACK_MODEL;
  }
  return requestedModel;
}

export function enforceCostControls(input: CostControlInput): CostControlResult {
  const estimatedTokens = estimateTokens(input.prompt);
  const maxTokens = input.maxTokens ?? MAX_TOKENS_PER_REQUEST;

  if (estimatedTokens > maxTokens) {
    logAPIEvent({
      event: 'ai.cost_control_blocked',
      route: input.route,
      severity: 'warn',
      estimatedTokens,
      limit: maxTokens,
      reason: 'token_limit',
    });
    return { allowed: false, reason: 'token_limit', estimatedTokens };
  }

  const now = Date.now();
  const key = `${input.route}:${input.userKey}`;
  const existing = requestWindows.get(key);
  if (!existing || now > existing.resetAt) {
    requestWindows.set(key, { count: 1, resetAt: now + 60_000 });
  } else if (existing.count >= MAX_COST_REQUESTS_PER_MINUTE) {
    logAPIEvent({
      event: 'ai.cost_control_blocked',
      route: input.route,
      severity: 'warn',
      estimatedTokens,
      limit: MAX_COST_REQUESTS_PER_MINUTE,
      reason: 'request_frequency',
    });
    return { allowed: false, reason: 'request_frequency', estimatedTokens };
  } else {
    existing.count++;
  }

  const fallbackModel = selectCostAwareModel(input.requestedModel, estimatedTokens);
  if (fallbackModel && fallbackModel !== input.requestedModel) {
    logAPIEvent({
      event: 'ai.cost_control_fallback',
      route: input.route,
      severity: 'info',
      estimatedTokens,
      requestedModel: input.requestedModel,
      fallbackModel,
    });
  }

  return { allowed: true, estimatedTokens, fallbackModel };
}

export function _resetCostControls(): void {
  requestWindows.clear();
}
