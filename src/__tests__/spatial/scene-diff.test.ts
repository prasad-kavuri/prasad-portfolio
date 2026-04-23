import { describe, it, expect } from 'vitest';
import { generateDiff } from '@/lib/spatial/scene-diff';
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
});
