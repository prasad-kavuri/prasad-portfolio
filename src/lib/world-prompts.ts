export type WorldObjective = 'cost' | 'speed' | 'safety' | 'coverage';

export type WorldRegion =
  | 'Downtown Core'
  | 'Transit District'
  | 'Waterfront Zone'
  | 'Airport Corridor'
  | 'University Belt';

export type WorldStyle = 'logistics-grid' | 'urban-mixed-use' | 'mobility-corridor';

export type WorldConstraintProfile = {
  budgetLevel: 'low' | 'medium' | 'high';
  congestionSensitivity: 'low' | 'medium' | 'high';
  accessibilityPriority: boolean;
  policyProfile: 'balanced' | 'safety-first' | 'throughput-first';
};

export const WORLD_REGION_OPTIONS: WorldRegion[] = [
  'Downtown Core',
  'Transit District',
  'Waterfront Zone',
  'Airport Corridor',
  'University Belt',
];

export const WORLD_OBJECTIVE_OPTIONS: WorldObjective[] = ['cost', 'speed', 'safety', 'coverage'];

export const WORLD_STYLE_OPTIONS: WorldStyle[] = ['logistics-grid', 'urban-mixed-use', 'mobility-corridor'];

export const WORLD_PROMPT_TEMPLATES: string[] = [
  'Generate a 3D downtown delivery zone with curbside loading bays, pedestrian-heavy corridors, and congestion pinch points.',
  'Create a mixed-use urban block optimized for last-mile fulfillment and safe pickup flow.',
  'Generate a transit-adjacent mobility zone with delivery drop-off areas and accessible pedestrian routing.',
  'Model a logistics-ready district with simulation-ready route corridors and policy-safe loading areas.',
];

export const DEFAULT_WORLD_CONSTRAINTS: WorldConstraintProfile = {
  budgetLevel: 'medium',
  congestionSensitivity: 'medium',
  accessibilityPriority: true,
  policyProfile: 'balanced',
};

export function hashWorldSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function pickWorldVariant(seed: number, variants: readonly string[]): string {
  if (variants.length === 0) return 'Baseline world variant';
  return variants[seed % variants.length];
}
