import type { ParametricScene, SpatialObject, SceneDiff } from './scene-schema';

export type { SceneDiff };

const TRACKED_PROPS: (keyof SpatialObject)[] = [
  'type', 'label', 'width', 'depth', 'height', 'radius',
  'material', 'color', 'policy', 'simulationReady',
];

function formatValue(v: unknown): string {
  if (v === undefined) return 'unset';
  if (typeof v === 'number') return `${v} m`;
  return String(v);
}

export function generateDiff(before: ParametricScene, after: ParametricScene): SceneDiff[] {
  const diffs: SceneDiff[] = [];

  const beforeMap = new Map(before.objects.map((o) => [o.id, o]));
  const afterMap = new Map(after.objects.map((o) => [o.id, o]));

  for (const [id, afterObj] of afterMap) {
    const beforeObj = beforeMap.get(id);
    if (!beforeObj) {
      diffs.push({ type: 'added', objectId: id, objectLabel: afterObj.label });
    } else {
      for (const prop of TRACKED_PROPS) {
        const bv = beforeObj[prop];
        const av = afterObj[prop];
        if (bv !== av) {
          diffs.push({
            type: 'updated',
            objectId: id,
            objectLabel: afterObj.label,
            property: prop,
            before: bv,
            after: av,
          });
        }
      }
      // Compare position/rotation/scale
      for (const vecProp of ['position', 'rotation', 'scale'] as const) {
        const bv = beforeObj[vecProp];
        const av = afterObj[vecProp];
        for (const axis of ['x', 'y', 'z'] as const) {
          if (bv[axis] !== av[axis]) {
            diffs.push({
              type: 'updated',
              objectId: id,
              objectLabel: afterObj.label,
              property: `${vecProp}.${axis}`,
              before: bv[axis],
              after: av[axis],
            });
          }
        }
      }
    }
  }

  for (const [id, beforeObj] of beforeMap) {
    if (!afterMap.has(id)) {
      diffs.push({ type: 'removed', objectId: id, objectLabel: beforeObj.label });
    }
  }

  return diffs;
}

export function formatDiffEntry(diff: SceneDiff): string {
  switch (diff.type) {
    case 'updated':
      return `${diff.objectLabel}.${diff.property}: ${formatValue(diff.before)} → ${formatValue(diff.after)}`;
    case 'added':
      return `+ ${diff.objectLabel} (added)`;
    case 'removed':
      return `- ${diff.objectLabel} (removed)`;
  }
}
