import { describe, it, expect } from 'vitest';
import {
  validateParametricScene,
  makeParametricScene,
  type ParametricScene,
  type SpatialObject,
} from '@/lib/spatial/scene-schema';

function makeObj(overrides: Partial<SpatialObject> = {}): SpatialObject {
  return {
    id: 'obj-1',
    type: 'block',
    label: 'Test Block',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    ...overrides,
  };
}

function makeScene(overrides: Partial<ParametricScene> = {}): ParametricScene {
  return {
    id: 'scene-1',
    version: 1,
    sourcePrompt: 'test prompt',
    region: 'downtown',
    objective: 'speed',
    objects: [],
    generatedAt: new Date().toISOString(),
    refinementHistory: [],
    ...overrides,
  };
}

describe('validateParametricScene', () => {
  it('valid scene with no objects passes', () => {
    const result = validateParametricScene(makeScene());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('valid scene with objects passes', () => {
    const result = validateParametricScene(makeScene({ objects: [makeObj()] }));
    expect(result.valid).toBe(true);
  });

  it('empty objects array passes', () => {
    const result = validateParametricScene(makeScene({ objects: [] }));
    expect(result.valid).toBe(true);
  });

  it('objects array > 50 items fails', () => {
    const objects = Array.from({ length: 51 }, (_, i) => makeObj({ id: `obj-${i}` }));
    const result = validateParametricScene(makeScene({ objects }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('50'))).toBe(true);
  });

  it('position out of range fails', () => {
    const obj = makeObj({ position: { x: 600, y: 0, z: 0 } });
    const result = validateParametricScene(makeScene({ objects: [obj] }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('position.x'))).toBe(true);
  });

  it('invalid color string fails', () => {
    const obj = makeObj({ color: 'not-a-color' });
    const result = validateParametricScene(makeScene({ objects: [obj] }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('color'))).toBe(true);
  });

  it('valid color string passes', () => {
    const obj = makeObj({ color: '#ff0000' });
    const result = validateParametricScene(makeScene({ objects: [obj] }));
    expect(result.valid).toBe(true);
  });

  it('scale out of range fails', () => {
    const obj = makeObj({ scale: { x: 0.01, y: 1, z: 1 } });
    const result = validateParametricScene(makeScene({ objects: [obj] }));
    expect(result.valid).toBe(false);
  });

  it('non-object input fails', () => {
    const result = validateParametricScene(null);
    expect(result.valid).toBe(false);
  });
});

describe('makeParametricScene', () => {
  it('creates a valid scene', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed' });
    const result = validateParametricScene(scene);
    expect(result.valid).toBe(true);
    expect(scene.version).toBe(1);
    expect(scene.refinementHistory).toHaveLength(0);
  });
});
