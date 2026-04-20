import { demos } from '@/data/demos';
import { EXECUTIVE_METRICS } from '@/lib/executive-metrics';

export const SITE_URL = 'https://www.prasadkavuri.com';
export const SITE_NAME = 'Prasad Kavuri Portfolio';

export const PORTFOLIO_FACTS = {
  // Canonical executive metrics — sourced from executive-metrics.ts
  yearsExperience: EXECUTIVE_METRICS.yearsExperience,
  engineersLed: EXECUTIVE_METRICS.engineersLed,
  b2bCustomersEnabled: EXECUTIVE_METRICS.b2bCustomersEnabled,
  costReductionDelivered: EXECUTIVE_METRICS.costReductionDelivered,
  revenueLaunched: EXECUTIVE_METRICS.revenueLaunched,
  // Page-specific derived facts
  latencyReduction: '50%',
  productionDemoCount: demos.length,
} as const;

export function formatProductionDemoLabel() {
  return `${PORTFOLIO_FACTS.productionDemoCount} production demos`;
}
