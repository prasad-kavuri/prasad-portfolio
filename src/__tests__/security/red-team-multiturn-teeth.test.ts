import { describe, it, expect, vi } from 'vitest';

/**
 * Proves the multi-turn suite can fail. The conversation guard is replaced with the behavior the
 * route had before SPEC-0024 (only the newest user message is screened, history is forwarded
 * untouched). A gate that stays green against that would be worthless.
 */
vi.mock('@/lib/conversation-guard', async () => {
  const { detectPromptInjection } = await vi.importActual<typeof import('@/lib/guardrails')>('@/lib/guardrails');
  return {
    screenConversation: (turns: Array<{ role: string; content: string }>) => {
      const newest = [...turns].reverse().find((t) => t.role === 'user');
      const flagged = !!newest && detectPromptInjection(newest.content).length > 0;
      return { rejectCurrent: flagged, reason: flagged ? 'injection' : undefined, messages: turns, dropped: [] };
    },
  };
});

describe('multi-turn red-team suite against the pre-SPEC-0024 behavior', () => {
  it('lets every conversation attack through and reports unexpected results', async () => {
    const { runRedTeam } = await import('@/lib/redteam/run');
    const report = runRedTeam();
    const conversation = report.cases.filter((c) => c.layer === 'conversation-guard' && c.expected === 'blocked');
    expect(conversation.length).toBeGreaterThanOrEqual(8);
    expect(conversation.every((c) => c.result === 'missed')).toBe(true);
    expect(report.totals.unexpected).toBeGreaterThanOrEqual(conversation.length);
  });
});
