/**
 * Canonical UTM-tagged URLs for recruiter conversion tracking.
 * All Calendly links in the portfolio must use these constants.
 * DO NOT hardcode calendly.com URLs elsewhere.
 */

export const CALENDLY_BASE = 'https://calendly.com/vbkpkavuri';

export const CALENDLY_URLS = {
  /** Used in hero / for-recruiters CTA */
  hero: `${CALENDLY_BASE}?utm_source=portfolio&utm_medium=hero&utm_campaign=vp-search-2026`,
  /** Used in footer / contact section */
  footer: `${CALENDLY_BASE}?utm_source=portfolio&utm_medium=footer&utm_campaign=vp-search-2026`,
  /** Used in /for-recruiters page */
  recruiters: `${CALENDLY_BASE}?utm_source=portfolio&utm_medium=for-recruiters&utm_campaign=vp-search-2026`,
  /** Used in /about page */
  about: `${CALENDLY_BASE}?utm_source=portfolio&utm_medium=about&utm_campaign=vp-search-2026`,
  /** Fallback for any other surface */
  default: `${CALENDLY_BASE}?utm_source=portfolio&utm_medium=site&utm_campaign=vp-search-2026`,
} as const;

export type CalendlyPlacement = keyof typeof CALENDLY_URLS;
