import { describe, it, expect } from 'vitest';
import { buildSceneRenderConfig, GEOMETRY_MAP, MATERIAL_MAP } from '@/lib/spatial/scene-renderer';
import { makeParametricScene } from '@/lib/spatial/scene-schema';
import type { SpatialObject } from '@/lib/spatial/scene-schema';

function makeObj(overrides: Partial<SpatialObject> = {}): SpatialObject {
  return {
    id: 'obj-1',
    type: 'block',
    label: 'test block',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    ...overrides,
  };
}

describe('buildSceneRenderConfig', () => {
  it('empty scene produces empty meshes array', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed' });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes).toHaveLength(0);
  });

  it('pure function: same input → same output', () => {
    const scene = makeParametricScene({
      sourcePrompt: 'test',
      region: 'downtown',
      objective: 'speed',
      objects: [makeObj({ id: 'obj-1', type: 'block' })],
    });
    const r1 = buildSceneRenderConfig(scene);
    const r2 = buildSceneRenderConfig(scene);
    expect(r1).toEqual(r2);
  });

  it('zone → PlaneGeometry', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects: [makeObj({ type: 'zone' })] });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].geometry).toBe('PlaneGeometry');
  });

  it('block → BoxGeometry', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects: [makeObj({ type: 'block' })] });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].geometry).toBe('BoxGeometry');
  });

  it('node → SphereGeometry', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects: [makeObj({ type: 'node' })] });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].geometry).toBe('SphereGeometry');
  });

  it('corridor → BoxGeometry', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects: [makeObj({ type: 'corridor' })] });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].geometry).toBe('BoxGeometry');
  });

  it('metal material maps to correct color and metalness', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects: [makeObj({ material: 'metal' })] });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].color).toBe(MATERIAL_MAP.metal.color);
    expect(config.meshes[0].metalness).toBe(0.8);
  });

  it('glass material is transparent', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects: [makeObj({ material: 'glass' })] });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].transparent).toBe(true);
    expect(config.meshes[0].opacity).toBeLessThan(1);
  });

  it('each SpatialObjectType is covered by GEOMETRY_MAP', () => {
    const types = ['zone', 'block', 'corridor', 'platform', 'node', 'primitive'] as const;
    for (const t of types) {
      expect(GEOMETRY_MAP[t]).toBeDefined();
    }
  });

  it('platform → BoxGeometry (line 76 branch)', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects: [makeObj({ type: 'platform' })] });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].geometry).toBe('BoxGeometry');
  });

  it('primitive → BoxGeometry (default branch)', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects: [makeObj({ type: 'primitive' })] });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].geometry).toBe('BoxGeometry');
    expect(config.meshes[0].color).toBe('#6a6aaa');
  });

  it('explicit color overrides material color (line 54 branch)', () => {
    const scene = makeParametricScene({
      sourcePrompt: 'test', region: 'downtown', objective: 'speed',
      objects: [makeObj({ color: '#ff0000', material: 'concrete' })],
    });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].color).toBe('#ff0000');
  });

  it('no material and no color uses default', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects: [makeObj()] });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].color).toBe('#6a6aaa');
  });

  it('concrete maps to correct color', () => {
    const scene = makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects: [makeObj({ material: 'concrete' })] });
    const config = buildSceneRenderConfig(scene);
    expect(config.meshes[0].color).toBe(MATERIAL_MAP.concrete.color);
  });
});
