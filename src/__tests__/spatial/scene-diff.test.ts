import { describe, it, expect } from 'vitest';
import { generateDiff, formatDiffEntry } from '@/lib/spatial/scene-diff';
import type { ParametricScene, SpatialObject } from '@/lib/spatial/scene-schema';

function makeObj(overrides: Partial<SpatialObject> = {}): SpatialObject {
  return {
    id: 'obj-1',
    type: 'block',
    label: 'warehouse',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    height: 5,
    ...overrides,
  };
}

function makeScene(objects: SpatialObject[]): ParametricScene {
  return {
    id: 'scene-1',
    version: 1,
    sourcePrompt: 'test',
    region: 'downtown',
    objective: 'speed',
    objects,
    generatedAt: new Date().toISOString(),
    refinementHistory: [],
  };
}

describe('generateDiff', () => {
  it('identical scenes produce empty diff', () => {
    const scene = makeScene([makeObj()]);
    const diff = generateDiff(scene, scene);
    expect(diff).toHaveLength(0);
  });

  it('updated property produces correct before/after diff entry', () => {
    const before = makeScene([makeObj({ height: 5 })]);
    const after = makeScene([makeObj({ height: 6 })]);
    const diff = generateDiff(before, after);
    const heightDiff = diff.find((d) => d.property === 'height');
    expect(heightDiff).toBeDefined();
    expect(heightDiff!.type).toBe('updated');
    expect(heightDiff!.before).toBe(5);
    expect(heightDiff!.after).toBe(6);
  });

  it('added object produces correct added entry', () => {
    const before = makeScene([makeObj({ id: 'obj-1' })]);
    const after = makeScene([makeObj({ id: 'obj-1' }), makeObj({ id: 'obj-2', label: 'loading-bay-2' })]);
    const diff = generateDiff(before, after);
    const added = diff.find((d) => d.type === 'added');
    expect(added).toBeDefined();
    expect(added!.objectLabel).toBe('loading-bay-2');
  });

  it('removed object produces correct removed entry', () => {
    const before = makeScene([makeObj({ id: 'obj-1' }), makeObj({ id: 'cp-1', label: 'congestion-point-1' })]);
    const after = makeScene([makeObj({ id: 'obj-1' })]);
    const diff = generateDiff(before, after);
    const removed = diff.find((d) => d.type === 'removed');
    expect(removed).toBeDefined();
    expect(removed!.objectLabel).toBe('congestion-point-1');
  });

  it('material change detected', () => {
    const before = makeScene([makeObj({ material: 'concrete' })]);
    const after = makeScene([makeObj({ material: 'metal' })]);
    const diff = generateDiff(before, after);
    const matDiff = diff.find((d) => d.property === 'material');
    expect(matDiff).toBeDefined();
    expect(matDiff!.before).toBe('concrete');
    expect(matDiff!.after).toBe('metal');
  });

  it('position change detected (line 47 branch)', () => {
    const before = makeScene([makeObj({ position: { x: 0, y: 0, z: 0 } })]);
    const after = makeScene([makeObj({ position: { x: 5, y: 0, z: 0 } })]);
    const diff = generateDiff(before, after);
    const posDiff = diff.find((d) => d.property === 'position.x');
    expect(posDiff).toBeDefined();
    expect(posDiff!.type).toBe('updated');
    expect(posDiff!.before).toBe(0);
    expect(posDiff!.after).toBe(5);
  });
});

describe('formatDiffEntry', () => {
  it('formats updated entry with number values', () => {
    const result = formatDiffEntry({ type: 'updated', objectId: 'o1', objectLabel: 'bay', property: 'height', before: 3, after: 4 });
    expect(result).toBe('bay.height: 3 m → 4 m');
  });

  it('formats updated entry with undefined before', () => {
    const result = formatDiffEntry({ type: 'updated', objectId: 'o1', objectLabel: 'bay', property: 'material', before: undefined, after: 'metal' });
    expect(result).toContain('unset');
    expect(result).toContain('metal');
  });

  it('formats added entry', () => {
    const result = formatDiffEntry({ type: 'added', objectId: 'o2', objectLabel: 'node-1' });
    expect(result).toBe('+ node-1 (added)');
  });

  it('formats removed entry', () => {
    const result = formatDiffEntry({ type: 'removed', objectId: 'o3', objectLabel: 'congestion-point' });
    expect(result).toBe('- congestion-point (removed)');
  });
});
