/**
 * Canonical executive-level proof points for the portfolio.
 * Update values here only — pages consume this module, not inline strings.
 *
 * These are the authoritative metrics surfaced on the homepage and /for-recruiters.
 * Sources: career history at Krutrim, Ola, and HERE Technologies.
 */

// Canonical named values — use these for prose and single-value references
export const EXECUTIVE_METRICS = {
  /** 20+ years building AI platforms and leading global engineering organizations */
  yearsExperience: '20+',
  /** 200+ engineers led across Krutrim, Ola, and HERE Technologies */
  engineersLed: '200+',
  /** 13K+ B2B enterprise customers enabled via Ola Maps API platform */
  b2bCustomersEnabled: '13K+',
  /** Full qualifier for prose: "Up to 70% AI inference cost reduction" */
  costReductionDelivered: 'Up to 70%',
  /** Numeric display value for stat cards (animates cleanly, qualifier in context) */
  costReductionDisplay: '70%',
  /** $10M+ revenue launched — Krutrim AI platform, 0 → production */
  revenueLaunched: '$10M+',
  /** 300-seat call center workflow automated via Kruti.ai agentic platform */
  callCenterAutomation: '300-seat',
  /** 35M+ points of interest indexed across Ola Maps enterprise platform */
  poisIndexed: '35M+',
  /** 13-language AI indexing and search capability built at Ola */
  languagesSupported: '13',
} as const;

// Display array for rendering stats grids on homepage and /for-recruiters.
// costReductionDisplay is used here so AnimatedCounter can animate 0→70%.
// The "Up to" qualifier appears in the context line.
// Order: highest-impact business metrics first so mobile row-1 (2-col grid)
// shows org scale + cost savings above the fold before scrolling.
export const EXECUTIVE_METRICS_DISPLAY = [
  { value: EXECUTIVE_METRICS.engineersLed,         label: 'Engineers Led',            context: 'across Krutrim, Ola & HERE' },
  { value: EXECUTIVE_METRICS.costReductionDisplay, label: 'Cost Reduction Delivered', context: 'Up to · AI inference at scale' },
  { value: EXECUTIVE_METRICS.yearsExperience,      label: 'Years Experience',         context: '' },
  { value: EXECUTIVE_METRICS.b2bCustomersEnabled,  label: 'B2B Customers Enabled',    context: '' },
  { value: EXECUTIVE_METRICS.revenueLaunched,      label: 'Revenue Launched',         context: 'Krutrim AI, 0→production' },
] as const;

// Extended display — all 6 proof points for the hero redesign (PR 2).
// Surfaces call center automation, POIs, and language coverage alongside core metrics.
export const EXECUTIVE_METRICS_EXTENDED = [
  { value: EXECUTIVE_METRICS.engineersLed,         label: 'Engineers Led',           context: 'Krutrim, Ola & HERE' },
  { value: EXECUTIVE_METRICS.costReductionDisplay, label: 'AI Cost Reduction',       context: 'Up to · inference at scale' },
  { value: EXECUTIVE_METRICS.callCenterAutomation, label: 'Call Center Automated',   context: 'Kruti.ai agentic workflows' },
  { value: EXECUTIVE_METRICS.poisIndexed,          label: 'POIs Indexed',            context: 'Ola Maps enterprise platform' },
  { value: EXECUTIVE_METRICS.languagesSupported,   label: 'Languages — AI',     context: 'Indic + global multilingual' },
  { value: EXECUTIVE_METRICS.revenueLaunched,      label: 'Revenue Launched',        context: 'Krutrim AI, 0→production' },
] as const;
