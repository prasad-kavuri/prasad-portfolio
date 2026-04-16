export type SpatialObjective = 'cost' | 'speed' | 'safety' | 'coverage';

export type SpatialRegion =
  | 'Downtown Core'
  | 'Transit District'
  | 'Waterfront Zone'
  | 'Airport Corridor'
  | 'University Belt';

export type SpatialConstraintProfile = {
  budgetLevel: 'low' | 'medium' | 'high';
  congestionSensitivity: 'low' | 'medium' | 'high';
  accessibilityPriority: boolean;
  policyProfile: 'balanced' | 'safety-first' | 'throughput-first';
};

export const SPATIAL_REGION_OPTIONS: SpatialRegion[] = [
  'Downtown Core',
  'Transit District',
  'Waterfront Zone',
  'Airport Corridor',
  'University Belt',
];

export const SPATIAL_OBJECTIVE_OPTIONS: SpatialObjective[] = [
  'cost',
  'speed',
  'safety',
  'coverage',
];

export const SPATIAL_SCENARIO_TEMPLATES: string[] = [
  'Optimize a downtown delivery zone for faster drop-offs.',
  'Evaluate curbside pickup placement for a busy mixed-use corridor.',
  'Simulate pedestrian and vehicle flow near a transit station.',
  'Assess site readiness for micro-fulfillment operations.',
];

export const DEFAULT_SPATIAL_CONSTRAINTS: SpatialConstraintProfile = {
  budgetLevel: 'medium',
  congestionSensitivity: 'medium',
  accessibilityPriority: true,
  policyProfile: 'balanced',
};

export function hashScenarioSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function pickScenarioVariant(seed: number, variants: readonly string[]): string {
  if (variants.length === 0) return 'Baseline scenario variant';
  const index = seed % variants.length;
  return variants[index];
}
