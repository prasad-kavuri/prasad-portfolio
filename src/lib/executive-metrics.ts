/**
 * Canonical executive-level proof points for the portfolio.
 * Update values here only — pages consume this module, not inline strings.
 *
 * These are the authoritative metrics surfaced on the homepage and /for-recruiters.
 * Sources: career history at Krutrim, Ola, and HERE Technologies.
 */

// Canonical named values — use these for single-value references
export const EXECUTIVE_METRICS = {
  /** 20+ years building AI platforms and leading global engineering organizations */
  yearsExperience: '20+',
  /** 200+ engineers led across Krutrim, Ola, and HERE Technologies */
  engineersLed: '200+',
  /** 13K+ B2B enterprise customers enabled via Ola Maps API platform */
  b2bCustomersEnabled: '13K+',
  /** Up to 70% AI inference cost reduction delivered at Ola / Krutrim scale */
  costReductionDelivered: 'Up to 70%',
  /** $10M+ revenue launched — Krutrim AI platform, 0 → production */
  revenueLaunched: '$10M+',
} as const;

// Display array for rendering stats grids — consume in Hero and /for-recruiters
export const EXECUTIVE_METRICS_DISPLAY = [
  { value: EXECUTIVE_METRICS.yearsExperience,       label: 'Years Experience',       context: '' },
  { value: EXECUTIVE_METRICS.engineersLed,          label: 'Engineers Led',          context: 'across Krutrim, Ola \u0026 HERE' },
  { value: EXECUTIVE_METRICS.b2bCustomersEnabled,   label: 'B2B Customers Enabled',  context: '' },
  { value: EXECUTIVE_METRICS.costReductionDelivered, label: 'Cost Reduction Delivered', context: 'AI inference at scale' },
  { value: EXECUTIVE_METRICS.revenueLaunched,       label: 'Revenue Launched',       context: 'Krutrim AI, 0\u2192production' },
] as const;
