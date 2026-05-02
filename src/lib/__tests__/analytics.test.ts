import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}));

import { track } from '@vercel/analytics';
import {
  trackResumeDownload,
  trackCalendlyClick,
  trackLinkedInClick,
  trackEmailClick,
} from '../analytics';

beforeEach(() => vi.clearAllMocks());

describe('analytics events', () => {
  it('trackResumeDownload calls track with correct event', () => {
    trackResumeDownload();
    expect(track).toHaveBeenCalledWith('resume_download', { source: 'portfolio' });
  });

  it('trackCalendlyClick passes placement', () => {
    trackCalendlyClick('hero');
    expect(track).toHaveBeenCalledWith('calendly_click', {
      placement: 'hero',
      campaign: 'vp-search-2026',
    });
  });

  it('trackLinkedInClick passes placement', () => {
    trackLinkedInClick('footer');
    expect(track).toHaveBeenCalledWith('linkedin_click', { placement: 'footer' });
  });

  it('trackEmailClick fires correct event', () => {
    trackEmailClick();
    expect(track).toHaveBeenCalledWith('email_click', { source: 'portfolio' });
  });
});
