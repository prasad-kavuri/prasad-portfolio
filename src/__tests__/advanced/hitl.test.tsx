import { describe, expect, it } from 'vitest';
import { resolveReviewCheckpoint } from '@/lib/hitl';

describe('HITL review mode', () => {
  it('requires approval before the portfolio assistant response is accepted', async () => {
    const checkpoint = resolveReviewCheckpoint({ content: 'Reviewed answer' }, true);

    expect(checkpoint.status).toBe('pending');
    expect(checkpoint.pending.content).toBe('Reviewed answer');
    expect(checkpoint.approved).toBeNull();
  });

  it('passes responses through when review mode is disabled', () => {
    const checkpoint = resolveReviewCheckpoint({ content: 'Final answer' }, false);

    expect(checkpoint.status).toBe('approved');
    expect(checkpoint.pending).toBeNull();
    expect(checkpoint.approved.content).toBe('Final answer');
  });
});
