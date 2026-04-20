/**
 * Strategic Compaction
 *
 * After every COMPACTION_TURN_THRESHOLD user turns, the full conversation
 * history is summarised into a single memory message. This keeps the context
 * window lean, prevents hallucination drift in long sessions, and demonstrates
 * a production AI operations pattern.
 *
 * Analogy: like git squash — you keep the meaningful outcome of many commits
 * without carrying all the intermediate noise forever.
 */

export const COMPACTION_TURN_THRESHOLD = 8;

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CompactionResult {
  messages: Message[];
  wasCompacted: boolean;
  turnCount: number;
}

export function countUserTurns(messages: Message[]): number {
  return messages.filter((m) => m.role === 'user').length;
}

export function buildCompactionPrompt(history: Message[]): string {
  const formatted = history
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  return `You are summarising a conversation for context compaction.
Produce a concise but complete summary of the exchange below.
Preserve: key facts stated, decisions made, questions answered, and any
technical details that would be needed to continue the conversation naturally.
Discard: pleasantries, repeated content, and filler.
Format: plain prose, 3-6 sentences maximum.

CONVERSATION TO SUMMARISE:
${formatted}

SUMMARY:`;
}

export async function maybeCompact(
  messages: Message[],
  compactFn: (prompt: string) => Promise<string>
): Promise<CompactionResult> {
  const userTurns = countUserTurns(messages);

  if (userTurns < COMPACTION_TURN_THRESHOLD) {
    return { messages, wasCompacted: false, turnCount: userTurns };
  }

  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  // Keep last 2 full turns (4 messages) verbatim for continuity
  const KEEP_RECENT = 4;
  const toCompress = conversationMessages.slice(0, -KEEP_RECENT);
  const recentMessages = conversationMessages.slice(-KEEP_RECENT);

  if (toCompress.length === 0) {
    return { messages, wasCompacted: false, turnCount: userTurns };
  }

  const compactionPrompt = buildCompactionPrompt(toCompress);
  const summary = await compactFn(compactionPrompt);

  const compactedMessages: Message[] = [
    ...systemMessages,
    {
      role: 'system',
      content: `[CONVERSATION MEMORY — compacted from ${toCompress.length} prior messages]\n${summary}`,
    },
    ...recentMessages,
  ];

  return {
    messages: compactedMessages,
    wasCompacted: true,
    turnCount: userTurns,
  };
}
