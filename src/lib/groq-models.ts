/**
 * Single source of truth for the Groq models the server demos call (SPEC-0029).
 *
 * Routes name a model or a tier from here, never a literal id, so retiring a model is a one-line change.
 * When Groq reports the requested model as retired or not available to the account, the helpers below retry
 * once with the next model in the tier's chain. Keep this file dependency-free (client pages import it too).
 *
 * Prices are USD per 1M tokens from Groq's public models page (2026-10-17). Preview models can be withdrawn at
 * short notice, so each chain ends on a production model.
 */

export type ModelTier = 'fast' | 'capable' | 'code';

/** How a model reports its thinking: gpt-oss takes reasoning_effort, qwen writes <think> blocks, others none. */
export type ReasoningStyle = 'effort' | 'inline' | 'none';

export interface GroqModel {
  id: string;
  name: string;
  provider: string;
  tier: ModelTier;
  /** USD per 1M input tokens */
  inputCost: number;
  /** USD per 1M output tokens */
  outputCost: number;
  reasoning: ReasoningStyle;
  preview: boolean;
  /** Illustrative numbers shown when a demo runs without a live call. */
  estimate: { latencyMs: number; outputTokens: number };
}

export const FAST_MODEL: GroqModel = {
  id: 'openai/gpt-oss-20b',
  name: 'GPT-OSS 20B',
  provider: 'OpenAI · Groq',
  tier: 'fast',
  inputCost: 0.075,
  outputCost: 0.3,
  reasoning: 'effort',
  preview: false,
  estimate: { latencyMs: 300, outputTokens: 90 },
};

export const CAPABLE_MODEL: GroqModel = {
  id: 'openai/gpt-oss-120b',
  name: 'GPT-OSS 120B',
  provider: 'OpenAI · Groq',
  tier: 'capable',
  inputCost: 0.15,
  outputCost: 0.6,
  reasoning: 'effort',
  preview: false,
  estimate: { latencyMs: 700, outputTokens: 130 },
};

export const CODE_MODEL: GroqModel = {
  id: 'qwen/qwen3.8-27b',
  name: 'Qwen3.8 27B (preview)',
  provider: 'Alibaba · Groq',
  tier: 'code',
  inputCost: 0.8,
  outputCost: 4,
  reasoning: 'inline',
  preview: true,
  estimate: { latencyMs: 650, outputTokens: 110 },
};

export const MODEL_CATALOG: readonly GroqModel[] = [FAST_MODEL, CAPABLE_MODEL, CODE_MODEL];
export const MODEL_IDS: readonly string[] = MODEL_CATALOG.map((m) => m.id);

const CHAINS: Record<ModelTier, readonly GroqModel[]> = {
  fast: [FAST_MODEL, CAPABLE_MODEL],
  capable: [CAPABLE_MODEL, FAST_MODEL],
  code: [CODE_MODEL, CAPABLE_MODEL],
};

export function modelById(id: string | undefined): GroqModel | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}

/** Ids to try, in order, starting with `id`. An id outside the catalog is tried alone. */
export function fallbackChain(id: string): string[] {
  const model = modelById(id);
  return model ? CHAINS[model.tier].map((m) => m.id) : [id];
}

/** Request fields a model needs so its answer lands in `content` and thinking stays cheap and hidden. */
export function reasoningParams(id: string): { reasoning_effort?: 'low'; include_reasoning?: false } {
  return modelById(id)?.reasoning === 'effort' ? { reasoning_effort: 'low', include_reasoning: false } : {};
}

/**
 * Thinking tokens count against the output limit, so a reasoning model given a small limit can return an empty
 * answer. Give reasoning models four times the headroom, capped.
 */
export function completionBudget(id: string, base: number): number {
  const reasoning = modelById(id)?.reasoning ?? 'none';
  return reasoning === 'none' ? base : Math.min(base * 4, 4096);
}

/** Drop <think>…</think> blocks that inline-reasoning models can leave in `content`. */
export function stripReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/** Groq answers a retired, unknown or plan-blocked model with 404, or 400/403 and a `model_…` error code. */
export function isModelUnavailable(status: number | undefined, code: string | null | undefined): boolean {
  if (status === 404) return true;
  return (status === 400 || status === 403) && typeof code === 'string' && code.startsWith('model_');
}

export type FallbackNotice = (from: string, to: string, status: number) => void;

async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { error?: { code?: unknown } };
    return typeof body?.error?.code === 'string' ? body.error.code : null;
  } catch {
    return null;
  }
}

/**
 * Run `send` for the primary model and, if Groq says it is unavailable, for the next ones in its chain.
 * Returns the last response (and the model that produced it) so callers keep their own error handling.
 */
export async function fetchWithModelFallback(
  primary: string,
  send: (model: string) => Promise<Response>,
  onFallback?: FallbackNotice,
): Promise<{ response: Response; model: string }> {
  const chain = fallbackChain(primary);
  let last: { response: Response; model: string } | undefined;
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    const response = await send(model);
    last = { response, model };
    const maybeUnavailable = !response.ok && [400, 403, 404].includes(response.status);
    if (!maybeUnavailable || typeof response.clone !== 'function') return last;
    const code = await readErrorCode(response.clone());
    if (!isModelUnavailable(response.status, code) || i === chain.length - 1) return last;
    onFallback?.(model, chain[i + 1], response.status);
  }
  return last as { response: Response; model: string };
}

function sdkErrorParts(error: unknown): { status?: number; code?: string } {
  if (typeof error !== 'object' || error === null) return {};
  const e = error as { status?: unknown; code?: unknown; error?: { error?: { code?: unknown }; code?: unknown } };
  const raw = e.code ?? e.error?.error?.code ?? e.error?.code;
  return {
    status: typeof e.status === 'number' ? e.status : undefined,
    code: typeof raw === 'string' ? raw : undefined,
  };
}

/** Same idea for the Groq SDK, which throws instead of returning a failed response. */
export async function callWithModelFallback<T>(
  primary: string,
  call: (model: string) => Promise<T>,
  onFallback?: FallbackNotice,
): Promise<{ result: T; model: string }> {
  const chain = fallbackChain(primary);
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      return { result: await call(model), model };
    } catch (error) {
      const { status, code } = sdkErrorParts(error);
      if (i === chain.length - 1 || !isModelUnavailable(status, code)) throw error;
      onFallback?.(model, chain[i + 1], status ?? 0);
    }
  }
  throw new Error('unreachable');
}
