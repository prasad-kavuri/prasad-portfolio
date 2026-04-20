import profile from '@/data/profile.json';
import { demos } from '@/data/demos';

export const SITE_URL = 'https://www.prasadkavuri.com';
export const SITE_NAME = 'Prasad Kavuri Portfolio';

export const PORTFOLIO_FACTS = {
  yearsExperience: profile.stats.find((stat) => stat.label === 'Years Experience')?.value ?? '20+',
  engineersLed: profile.stats.find((stat) => stat.label === 'Engineers Led')?.value ?? '200+',
  b2bCustomersEnabled: profile.stats.find((stat) => stat.label === 'B2B Customers Enabled')?.value ?? '13K+',
  costReductionDelivered: profile.stats.find((stat) => stat.label === 'Cost Reduction Delivered')?.value ?? 'Up to 70%',
  latencyReduction: '50%',
  revenueLaunched: '$10M+',
  productionDemoCount: demos.length,
} as const;

export function formatProductionDemoLabel() {
  return `${PORTFOLIO_FACTS.productionDemoCount} production demos`;
}
