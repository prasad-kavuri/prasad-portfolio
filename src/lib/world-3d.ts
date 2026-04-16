import type { WorldScenePrimitive, WorldSceneSpec } from '@/lib/world-assets';
import { validateWorldSceneSpec } from '@/lib/world-assets';

export type WorldRenderablePrimitive = {
  id: string;
  label: string;
  kind: WorldScenePrimitive['kind'];
  size: { width: number; height: number; depth: number };
  position: { x: number; y: number; z: number };
  colorHex: string;
  opacity: number;
};

export type WorldSceneComplexity = {
  primitiveCount: number;
  budget: number;
  isWithinBudget: boolean;
};

export function mapSceneSpecToRenderablePrimitives(sceneSpec: WorldSceneSpec): WorldRenderablePrimitive[] {
  return sceneSpec.primitives.map((primitive) => {
    const safeHeight = Math.max(0.08, Number(primitive.height.toFixed(2)));
    const isFlat = primitive.kind === 'corridor' || primitive.kind === 'transit-link' || primitive.kind === 'safety-buffer';

    return {
      id: primitive.id,
      label: primitive.label,
      kind: primitive.kind,
      size: {
        width: Number(primitive.size.width.toFixed(2)),
        height: isFlat ? 0.08 : safeHeight,
        depth: Number(primitive.size.depth.toFixed(2)),
      },
      position: {
        x: Number(primitive.position.x.toFixed(2)),
        y: isFlat ? 0.04 : safeHeight / 2,
        z: Number(primitive.position.z.toFixed(2)),
      },
      colorHex: primitive.colorHex,
      opacity: primitive.kind === 'safety-buffer' ? 0.45 : 0.9,
    };
  });
}

export function getWorldSceneComplexity(sceneSpec: WorldSceneSpec): WorldSceneComplexity {
  return {
    primitiveCount: sceneSpec.primitives.length,
    budget: sceneSpec.primitiveBudget,
    isWithinBudget: sceneSpec.primitives.length <= sceneSpec.primitiveBudget,
  };
}

export function getWorldExportEligibility(sceneSpec: WorldSceneSpec): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const shape = validateWorldSceneSpec(sceneSpec);
  if (!shape.isValid) reasons.push(...shape.reasons);

  const complexity = getWorldSceneComplexity(sceneSpec);
  if (!complexity.isWithinBudget) reasons.push('scene_complexity_exceeded');
  if (sceneSpec.exportReadiness !== 'ready') reasons.push('scene_export_readiness_review');

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

function createThreeSceneModuleError(): Error {
  return new Error('3D export is only available in browser environments.');
}

/* c8 ignore start */
function sanitizeFileSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64);
}

export function buildWorldExportFileName(sceneSpec: WorldSceneSpec): string {
  const region = sanitizeFileSegment(sceneSpec.region);
  const style = sanitizeFileSegment(sceneSpec.style);
  const world = sanitizeFileSegment(sceneSpec.worldId);
  return `world-${region}-${style}-${world}.glb`;
}

export async function exportWorldSceneAsGlb(sceneSpec: WorldSceneSpec): Promise<{ fileName: string; byteLength: number }> {
  const eligibility = getWorldExportEligibility(sceneSpec);
  if (!eligibility.eligible) {
    throw new Error(`Export unavailable: ${eligibility.reasons.join(',')}`);
  }

  if (typeof window === 'undefined') {
    throw createThreeSceneModuleError();
  }

  const THREE = await import('three');
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const renderables = mapSceneSpecToRenderablePrimitives(sceneSpec);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#030712');

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(72, 72),
    new THREE.MeshStandardMaterial({ color: '#0b1220', roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  for (const primitive of renderables) {
    const geometry = new THREE.BoxGeometry(primitive.size.width, primitive.size.height, primitive.size.depth);
    const material = new THREE.MeshStandardMaterial({
      color: primitive.colorHex,
      roughness: 0.8,
      metalness: primitive.kind === 'structure' ? 0.15 : 0.05,
      transparent: primitive.opacity < 1,
      opacity: primitive.opacity,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(primitive.position.x, primitive.position.y, primitive.position.z);
    mesh.name = primitive.label;
    scene.add(mesh);
  }

  scene.add(new THREE.AmbientLight('#dbeafe', 1.1));
  const directional = new THREE.DirectionalLight('#ffffff', 1.2);
  directional.position.set(12, 30, 18);
  scene.add(directional);

  const exporter = new GLTFExporter();
  const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
          return;
        }
        reject(new Error('GLB export returned non-binary output.'));
      },
      (error) => reject(error),
      { binary: true }
    );
  });

  const blob = new Blob([glb], { type: 'model/gltf-binary' });
  const fileName = buildWorldExportFileName(sceneSpec);
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }

  return {
    fileName,
    byteLength: glb.byteLength,
  };
}
/* c8 ignore stop */
