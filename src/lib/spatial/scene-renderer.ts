import type { ParametricScene, SpatialObject, SpatialObjectType, SpatialMaterial } from './scene-schema';

export type GeometryType = 'PlaneGeometry' | 'BoxGeometry' | 'CylinderGeometry' | 'SphereGeometry' | 'ConeGeometry';

export interface MeshConfig {
  id: string;
  label: string;
  geometry: GeometryType;
  geometryArgs: number[];
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  metalness: number;
  transparent: boolean;
  opacity: number;
}

export interface SceneRenderConfig {
  meshes: MeshConfig[];
  sceneId: string;
  version: number;
}

const GEOMETRY_MAP: Record<SpatialObjectType, GeometryType> = {
  zone: 'PlaneGeometry',
  block: 'BoxGeometry',
  corridor: 'BoxGeometry',
  platform: 'BoxGeometry',
  node: 'SphereGeometry',
  primitive: 'BoxGeometry',
};

interface MaterialConfig {
  color: string;
  metalness: number;
  transparent: boolean;
  opacity: number;
}

const MATERIAL_MAP: Record<SpatialMaterial, MaterialConfig> = {
  concrete: { color: '#8a8a8a', metalness: 0, transparent: false, opacity: 1 },
  asphalt:  { color: '#3d3d3d', metalness: 0, transparent: false, opacity: 1 },
  metal:    { color: '#99aabb', metalness: 0.8, transparent: false, opacity: 1 },
  glass:    { color: '#88ccff', metalness: 0, transparent: true, opacity: 0.4 },
  wood:     { color: '#8B6914', metalness: 0, transparent: false, opacity: 1 },
  grass:    { color: '#3a7d44', metalness: 0, transparent: false, opacity: 1 },
};

const DEFAULT_MATERIAL: MaterialConfig = { color: '#6a6aaa', metalness: 0, transparent: false, opacity: 1 };

function resolveMaterial(obj: SpatialObject): MaterialConfig {
  if (obj.color) {
    return { ...DEFAULT_MATERIAL, color: obj.color };
  }
  if (obj.material && MATERIAL_MAP[obj.material]) {
    return MATERIAL_MAP[obj.material];
  }
  return DEFAULT_MATERIAL;
}

function resolveGeometryArgs(obj: SpatialObject): number[] {
  const w = obj.width ?? 1;
  const d = obj.depth ?? 1;
  const h = obj.height ?? 1;
  const r = obj.radius ?? 0.5;

  switch (obj.type) {
    case 'zone':
      return [w, d];
    case 'block':
      return [w, h, d];
    case 'corridor':
      return [w, 0.2, d];
    case 'platform':
      return [w, 0.3, d];
    case 'node':
      return [r, 16, 16];
    case 'primitive':
    default:
      return [1, 1, 1];
  }
}

function objectToMeshConfig(obj: SpatialObject): MeshConfig {
  const mat = resolveMaterial(obj);
  return {
    id: obj.id,
    label: obj.label,
    geometry: GEOMETRY_MAP[obj.type] ?? 'BoxGeometry',
    geometryArgs: resolveGeometryArgs(obj),
    position: [obj.position.x, obj.position.y, obj.position.z],
    rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
    scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    color: mat.color,
    metalness: mat.metalness,
    transparent: mat.transparent,
    opacity: mat.opacity,
  };
}

export function buildSceneRenderConfig(scene: ParametricScene): SceneRenderConfig {
  return {
    meshes: scene.objects.map(objectToMeshConfig),
    sceneId: scene.id,
    version: scene.version,
  };
}

export { GEOMETRY_MAP, MATERIAL_MAP };
