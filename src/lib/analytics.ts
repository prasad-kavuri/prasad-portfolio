import { track } from '@vercel/analytics';

export const trackEvent = (name: string, props?: Record<string, string>) => {
  try { track(name, props); } catch {}
};

/**
 * Recruiter conversion events.
 * Call these on user interaction, not on page load.
 */
export const trackResumeDownload = () =>
  track('resume_download', { source: 'portfolio' });

export const trackCalendlyClick = (placement: string) =>
  track('calendly_click', { placement, campaign: 'vp-search-2026' });

export const trackLinkedInClick = (placement: string) =>
  track('linkedin_click', { placement });

export const trackEmailClick = () =>
  track('email_click', { source: 'portfolio' });
