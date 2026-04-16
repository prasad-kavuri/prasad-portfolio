import { hashWorldSeed, type WorldObjective, type WorldRegion, type WorldStyle } from '@/lib/world-prompts';

export type WorldCellType = 'road' | 'pedestrian' | 'logistics' | 'pickup' | 'buffer' | 'transit';

export type WorldPreview = {
  width: number;
  height: number;
  cells: WorldCellType[];
  legend: Array<{ type: WorldCellType; label: string }>;
};

export type WorldAssetSummary = {
  meshConcept: string;
  representation: 'mesh-concept' | 'point-cloud-concept' | '3dgs-concept';
  sceneZones: string[];
  routeCorridors: string[];
  loadingAreas: string[];
  pedestrianAreas: string[];
  simulationReadiness: 'ready' | 'review';
};

export type WorldPrimitiveKind =
  | 'zone-block'
  | 'corridor'
  | 'structure'
  | 'safety-buffer'
  | 'transit-link';

export type WorldScenePrimitive = {
  id: string;
  label: string;
  kind: WorldPrimitiveKind;
  position: { x: number; z: number };
  size: { width: number; depth: number };
  height: number;
  colorHex: string;
};

export type WorldSceneSpec = {
  worldId: string;
  title: string;
  region: WorldRegion;
  objective: WorldObjective;
  style: WorldStyle;
  providerMode: 'mock' | 'hyworld-adapter';
  availability: 'available' | 'fallback';
  exportReadiness: 'ready' | 'review';
  simulationReadiness: 'ready' | 'review';
  warnings: string[];
  primitiveBudget: number;
  primitives: WorldScenePrimitive[];
};

export const WORLD_SCENE_LIMITS = {
  maxPrimitives: 42,
  maxSceneWidth: 48,
  maxSceneDepth: 48,
};

const CELL_TYPES: WorldCellType[] = ['road', 'pedestrian', 'logistics', 'pickup', 'buffer', 'transit'];

function pick(seed: number, index: number): WorldCellType {
  return CELL_TYPES[(seed + index * 17) % CELL_TYPES.length];
}

export function buildWorldPreview(input: {
  prompt: string;
  region: WorldRegion;
  style: WorldStyle;
  objective: WorldObjective;
}): WorldPreview {
  const seed = hashWorldSeed(`${input.prompt}:${input.region}:${input.style}:${input.objective}`);
  const width = 12;
  const height = 8;
  const cells = Array.from({ length: width * height }, (_, idx) => pick(seed, idx));

  return {
    width,
    height,
    cells,
    legend: [
      { type: 'road', label: 'Route corridor' },
      { type: 'logistics', label: 'Logistics zone' },
      { type: 'pickup', label: 'Pickup / curbside area' },
      { type: 'pedestrian', label: 'Pedestrian flow zone' },
      { type: 'buffer', label: 'Safety buffer' },
      { type: 'transit', label: 'Transit linkage' },
    ],
  };
}

export function buildWorldAssetSummary(input: {
  region: WorldRegion;
  style: WorldStyle;
  objective: WorldObjective;
  simulationReady: boolean;
}): WorldAssetSummary {
  const meshConcept =
    input.style === 'logistics-grid'
      ? 'Structured block mesh with curb-access primitives'
      : input.style === 'urban-mixed-use'
        ? 'Mixed-use parcel mesh with pedestrian-first corridors'
        : 'Transit-linked corridor mesh with multi-modal ingress nodes';

  return {
    meshConcept,
    representation: input.style === 'mobility-corridor' ? '3dgs-concept' : 'mesh-concept',
    sceneZones: [
      `${input.region} operations core`,
      'Policy-safe buffer zone',
      'Curbside interaction zone',
    ],
    routeCorridors: [
      input.objective === 'speed' ? 'Fast-path priority corridor' : 'Balanced throughput corridor',
      'Fallback congestion reroute corridor',
    ],
    loadingAreas: ['Primary loading bay cluster', 'Secondary overflow bay'],
    pedestrianAreas: ['High-footfall crossing mesh', 'Accessibility-first routing lane'],
    simulationReadiness: input.simulationReady ? 'ready' : 'review',
  };
}

function pickColor(kind: WorldPrimitiveKind): string {
  if (kind === 'zone-block') return '#2563eb';
  if (kind === 'corridor') return '#64748b';
  if (kind === 'structure') return '#0f172a';
  if (kind === 'safety-buffer') return '#8b5cf6';
  return '#06b6d4';
}

function scaled(seed: number, index: number, base: number, spread: number): number {
  const value = ((seed >>> (index % 16)) + index * 31) % 100;
  return Number((base + (value / 100) * spread).toFixed(2));
}

export function buildWorldSceneSpec(input: {
  prompt: string;
  region: WorldRegion;
  objective: WorldObjective;
  style: WorldStyle;
  providerMode: 'mock' | 'hyworld-adapter';
  availability: 'available' | 'fallback';
  simulationReady: boolean;
}): WorldSceneSpec {
  const seed = hashWorldSeed(`${input.prompt}:${input.region}:${input.style}:${input.objective}:${input.providerMode}`);
  const primitives: WorldScenePrimitive[] = [];
  const zoneKinds: Array<{ id: string; label: string; kind: WorldPrimitiveKind; height: number }> = [
    { id: 'ops-core', label: 'Operations Core', kind: 'zone-block', height: 2.4 },
    { id: 'logistics', label: 'Logistics Zone', kind: 'zone-block', height: 2.1 },
    { id: 'pickup', label: 'Pickup / Curbside', kind: 'zone-block', height: 1.3 },
    { id: 'pedestrian', label: 'Pedestrian Priority Zone', kind: 'zone-block', height: 0.8 },
    { id: 'buffer', label: 'Safety Buffer', kind: 'safety-buffer', height: 0.25 },
    { id: 'transit', label: 'Transit Linkage', kind: 'transit-link', height: 0.3 },
  ];

  zoneKinds.forEach((zone, index) => {
    primitives.push({
      id: zone.id,
      label: zone.label,
      kind: zone.kind,
      position: {
        x: scaled(seed, index + 2, -16, 30),
        z: scaled(seed, index + 7, -13, 26),
      },
      size: {
        width: scaled(seed, index + 13, 4.5, 8),
        depth: scaled(seed, index + 17, 4, 7),
      },
      height: zone.height,
      colorHex: pickColor(zone.kind),
    });
  });

  const corridorCount = input.style === 'mobility-corridor' ? 5 : 3;
  for (let i = 0; i < corridorCount; i++) {
    primitives.push({
      id: `corridor-${i + 1}`,
      label: `Route Corridor ${i + 1}`,
      kind: 'corridor',
      position: {
        x: scaled(seed, i + 21, -18, 36),
        z: scaled(seed, i + 29, -18, 36),
      },
      size: {
        width: scaled(seed, i + 31, 8, 16),
        depth: scaled(seed, i + 37, 1.6, 2),
      },
      height: 0.2,
      colorHex: pickColor('corridor'),
    });
  }

  const structureCount = input.objective === 'coverage' ? 6 : 4;
  for (let i = 0; i < structureCount; i++) {
    primitives.push({
      id: `structure-${i + 1}`,
      label: `Operational Block ${i + 1}`,
      kind: 'structure',
      position: {
        x: scaled(seed, i + 41, -14, 30),
        z: scaled(seed, i + 47, -14, 30),
      },
      size: {
        width: scaled(seed, i + 53, 2.2, 3.8),
        depth: scaled(seed, i + 59, 2, 3.5),
      },
      height: scaled(seed, i + 61, 1.6, 3.2),
      colorHex: pickColor('structure'),
    });
  }

  const warnings: string[] = [];
  if (input.availability === 'fallback') {
    warnings.push('Adapter fallback mode active: scene generated from deterministic procedural pipeline.');
  }
  if (input.providerMode === 'hyworld-adapter') {
    warnings.push('HY-World integration is adapter-wired for future upstream model generation.');
  }

  return {
    worldId: `world-${seed.toString(16)}`,
    title: `${input.region} ${input.style} procedural scene`,
    region: input.region,
    objective: input.objective,
    style: input.style,
    providerMode: input.providerMode,
    availability: input.availability,
    exportReadiness: input.simulationReady ? 'ready' : 'review',
    simulationReadiness: input.simulationReady ? 'ready' : 'review',
    warnings,
    primitiveBudget: WORLD_SCENE_LIMITS.maxPrimitives,
    primitives: primitives.slice(0, WORLD_SCENE_LIMITS.maxPrimitives),
  };
}

export function validateWorldSceneSpec(sceneSpec: WorldSceneSpec): { isValid: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!sceneSpec.worldId) reasons.push('scene_world_id_missing');
  if (!sceneSpec.primitives.length) reasons.push('scene_primitives_missing');
  if (sceneSpec.primitives.length > WORLD_SCENE_LIMITS.maxPrimitives) reasons.push('scene_primitives_exceeded');

  for (const primitive of sceneSpec.primitives) {
    if (primitive.size.width <= 0 || primitive.size.depth <= 0 || primitive.height < 0) {
      reasons.push(`scene_primitive_invalid:${primitive.id}`);
    }
    if (Math.abs(primitive.position.x) > WORLD_SCENE_LIMITS.maxSceneWidth || Math.abs(primitive.position.z) > WORLD_SCENE_LIMITS.maxSceneDepth) {
      reasons.push(`scene_primitive_out_of_bounds:${primitive.id}`);
    }
  }

  return {
    isValid: reasons.length === 0,
    reasons,
  };
}
