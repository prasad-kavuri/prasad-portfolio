export type SpatialObjectType =
  | 'zone'
  | 'block'
  | 'corridor'
  | 'platform'
  | 'node'
  | 'primitive';

export type SpatialMaterial =
  | 'concrete'
  | 'asphalt'
  | 'glass'
  | 'metal'
  | 'wood'
  | 'grass';

export interface SpatialObject {
  id: string;
  type: SpatialObjectType;
  label: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  width?: number;
  depth?: number;
  height?: number;
  radius?: number;
  material?: SpatialMaterial;
  color?: string;
  policy?: string;
  simulationReady?: boolean;
}

export interface SceneDiff {
  type: 'updated' | 'added' | 'removed';
  objectId: string;
  objectLabel: string;
  property?: string;
  before?: unknown;
  after?: unknown;
}

export interface RefinementEntry {
  instruction: string;
  diff: SceneDiff[];
  appliedAt: string;
  engine: 'deterministic' | 'llm-open-source' | 'fallback';
}

export interface ParametricScene {
  id: string;
  version: number;
  sourcePrompt: string;
  region: string;
  objective: string;
  objects: SpatialObject[];
  generatedAt: string;
  refinementHistory: RefinementEntry[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_OBJECT_TYPES = new Set<string>(['zone', 'block', 'corridor', 'platform', 'node', 'primitive']);
const VALID_MATERIALS = new Set<string>(['concrete', 'asphalt', 'glass', 'metal', 'wood', 'grass']);
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampToSchema(obj: SpatialObject): SpatialObject {
  const clampVec = (v: { x: number; y: number; z: number }, min: number, max: number) => ({
    x: clamp(v.x, min, max),
    y: clamp(v.y, min, max),
    z: clamp(v.z, min, max),
  });
  return {
    ...obj,
    position: clampVec(obj.position, -500, 500),
    scale: clampVec(obj.scale, 0.1, 50),
    ...(obj.width !== undefined && { width: clamp(obj.width, 0.5, 200) }),
    ...(obj.depth !== undefined && { depth: clamp(obj.depth, 0.5, 200) }),
    ...(obj.height !== undefined && { height: clamp(obj.height, 0.5, 200) }),
    ...(obj.radius !== undefined && { radius: clamp(obj.radius, 0.25, 100) }),
  };
}

function validateSpatialObject(obj: SpatialObject, index: number): string[] {
  const errors: string[] = [];
  const prefix = `objects[${index}]`;

  if (!obj.id || typeof obj.id !== 'string') errors.push(`${prefix}.id must be a non-empty string`);
  if (!VALID_OBJECT_TYPES.has(obj.type)) errors.push(`${prefix}.type "${obj.type}" is not valid`);
  if (!obj.label || typeof obj.label !== 'string') errors.push(`${prefix}.label must be a non-empty string`);

  for (const axis of ['x', 'y', 'z'] as const) {
    const p = obj.position[axis];
    if (p < -500 || p > 500) errors.push(`${prefix}.position.${axis} ${p} out of range [-500, 500]`);
    const s = obj.scale[axis];
    if (s < 0.1 || s > 50) errors.push(`${prefix}.scale.${axis} ${s} out of range [0.1, 50]`);
  }

  if (obj.width !== undefined && (obj.width < 0.5 || obj.width > 200))
    errors.push(`${prefix}.width ${obj.width} out of range [0.5, 200]`);
  if (obj.depth !== undefined && (obj.depth < 0.5 || obj.depth > 200))
    errors.push(`${prefix}.depth ${obj.depth} out of range [0.5, 200]`);
  if (obj.height !== undefined && (obj.height < 0.5 || obj.height > 200))
    errors.push(`${prefix}.height ${obj.height} out of range [0.5, 200]`);
  if (obj.radius !== undefined && (obj.radius < 0.25 || obj.radius > 100))
    errors.push(`${prefix}.radius ${obj.radius} out of range [0.25, 100]`);

  if (obj.material !== undefined && !VALID_MATERIALS.has(obj.material))
    errors.push(`${prefix}.material "${obj.material}" is not valid`);
  if (obj.color !== undefined && !COLOR_RE.test(obj.color))
    errors.push(`${prefix}.color "${obj.color}" must match #RRGGBB`);

  return errors;
}

export function validateParametricScene(scene: unknown): ValidationResult {
  const errors: string[] = [];

  if (!scene || typeof scene !== 'object') {
    return { valid: false, errors: ['scene must be an object'] };
  }

  const s = scene as Record<string, unknown>;

  if (typeof s['id'] !== 'string' || !s['id']) errors.push('id must be a non-empty string');
  if (typeof s['version'] !== 'number') errors.push('version must be a number');
  if (typeof s['sourcePrompt'] !== 'string') errors.push('sourcePrompt must be a string');
  if (typeof s['region'] !== 'string') errors.push('region must be a string');
  if (typeof s['objective'] !== 'string') errors.push('objective must be a string');
  if (typeof s['generatedAt'] !== 'string') errors.push('generatedAt must be a string');

  if (!Array.isArray(s['objects'])) {
    errors.push('objects must be an array');
  } else {
    if (s['objects'].length > 50) errors.push(`objects array exceeds max 50 items (got ${s['objects'].length})`);
    for (let i = 0; i < s['objects'].length; i++) {
      errors.push(...validateSpatialObject(s['objects'][i] as SpatialObject, i));
    }
  }

  if (!Array.isArray(s['refinementHistory'])) errors.push('refinementHistory must be an array');

  return { valid: errors.length === 0, errors };
}

export function makeParametricScene(
  opts: Pick<ParametricScene, 'sourcePrompt' | 'region' | 'objective'> & { objects?: SpatialObject[] }
): ParametricScene {
  return {
    id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    version: 1,
    sourcePrompt: opts.sourcePrompt,
    region: opts.region,
    objective: opts.objective,
    objects: opts.objects ?? [],
    generatedAt: new Date().toISOString(),
    refinementHistory: [],
  };
}
