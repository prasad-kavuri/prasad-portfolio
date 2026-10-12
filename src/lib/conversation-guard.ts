/**
 * Conversation-level injection screening (SPEC-0024).
 *
 * The chat client sends the whole conversation on every request, so the server cannot trust any of
 * it. Screening only the newest message lets an attacker build trust over several turns, split a
 * payload across turns, plant an injection early and ask a benign question last, or forge an
 * "assistant" turn. This applies the existing single-message detector across the conversation.
 *
 * Policy (chosen so one flagged message never locks a legitimate session out, because the chat UI
 * keeps a refused message in its history):
 *  - refuse the request only when the NEWEST user message is at fault, either on its own or by
 *    completing a payload split across the last few user turns;
 *  - silently drop earlier turns that are flagged, or that are part of a flagged split payload, so
 *    they never reach the model or the compaction summary.
 */
import { detectPromptInjection } from '@/lib/guardrails';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationScreening {
  /** True when the newest user message must be refused (the request fails with a validation error). */
  rejectCurrent: boolean;
  reason?: 'injection' | 'split_payload';
  /** The conversation to forward: flagged earlier turns removed. */
  messages: ConversationTurn[];
  /** Indexes, in the input array, of the earlier turns that were removed. */
  dropped: number[];
}

/** How many consecutive user turns are joined to look for a payload split across turns. */
const SPLIT_WINDOW = 3;

const signatureHits = (text: string) => detectPromptInjection(text).filter((issue) => issue.startsWith('injection_attempt:'));

/** A single user turn is flagged by the same rule the route already applies to the newest message. */
const userTurnFlagged = (text: string) => detectPromptInjection(text).length > 0;

/** Assistant turns are model output, so markup is judged by the output sanitizer; only signatures count. */
const assistantTurnFlagged = (text: string) => signatureHits(text).length > 0;

export function screenConversation(turns: ConversationTurn[]): ConversationScreening {
  const userIdx = turns.flatMap((turn, index) => (turn.role === 'user' ? [index] : []));
  const last = userIdx.length - 1;
  if (last < 0) return { rejectCurrent: false, messages: turns, dropped: [] };

  // User turns [from..to], by user-turn position, joined the way a reader would see them.
  const joined = (from: number, to: number) =>
    userIdx.slice(from, to + 1).map((i) => turns[i].content).join(' ');

  // 1. Is the newest user message at fault?
  if (userTurnFlagged(turns[userIdx[last]].content)) {
    return { rejectCurrent: true, reason: 'injection', messages: turns, dropped: [] };
  }
  for (let from = Math.max(0, last - (SPLIT_WINDOW - 1)); from < last; from++) {
    // Only the newest turn is blamed when the earlier turns alone were harmless.
    if (signatureHits(joined(from, last)).length > 0 && signatureHits(joined(from, last - 1)).length === 0) {
      return { rejectCurrent: true, reason: 'split_payload', messages: turns, dropped: [] };
    }
  }

  // 2. Remove anything flagged from the history that will be forwarded.
  const tainted = new Set<number>();
  for (let pos = 0; pos < last; pos++) {
    if (userTurnFlagged(turns[userIdx[pos]].content)) tainted.add(userIdx[pos]);
    for (let end = pos + 1; end < last && end - pos < SPLIT_WINDOW; end++) {
      if (signatureHits(joined(pos, end)).length > 0) {
        for (let k = pos; k <= end; k++) tainted.add(userIdx[k]);
      }
    }
  }
  turns.forEach((turn, index) => {
    if (turn.role === 'assistant' && assistantTurnFlagged(turn.content)) tainted.add(index);
  });

  return {
    rejectCurrent: false,
    messages: turns.filter((_, index) => !tainted.has(index)),
    dropped: [...tainted].sort((a, b) => a - b),
  };
}
