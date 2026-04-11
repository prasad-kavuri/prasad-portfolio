import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}));

import { trackEvent } from '@/lib/analytics';
import { track } from '@vercel/analytics';

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls track with event name and props', () => {
    trackEvent('demo_opened', { demo: 'llm-router' });
    expect(track).toHaveBeenCalledWith('demo_opened', { demo: 'llm-router' });
  });

  it('calls track with only event name (no props)', () => {
    trackEvent('resume_downloaded');
    expect(track).toHaveBeenCalledWith('resume_downloaded', undefined);
  });

  it('silently catches errors thrown by track', () => {
    (track as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('Analytics unavailable');
    });
    expect(() => trackEvent('test_event')).not.toThrow();
  });

  it('calls track for linkedin_clicked event', () => {
    trackEvent('linkedin_clicked');
    expect(track).toHaveBeenCalledWith('linkedin_clicked', undefined);
  });

  it('calls track with article props', () => {
    trackEvent('article_expanded', { article: 'post-1' });
    expect(track).toHaveBeenCalledWith('article_expanded', { article: 'post-1' });
  });
});
