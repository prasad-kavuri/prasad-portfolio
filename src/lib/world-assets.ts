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
