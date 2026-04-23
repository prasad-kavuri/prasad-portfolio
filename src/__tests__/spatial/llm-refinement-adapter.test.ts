import { describe, it, expect } from 'vitest';
import { applyPatches, llmRefineScene } from '@/lib/spatial/llm-refinement-adapter';
import { makeParametricScene } from '@/lib/spatial/scene-schema';
import type { SpatialObject } from '@/lib/spatial/scene-schema';

function makeObj(overrides: Partial<SpatialObject> = {}): SpatialObject {
  return {
    id: 'obj-1',
    type: 'block',
    label: 'loading bay',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    height: 3,
    ...overrides,
  };
}

function makeScene(objects: SpatialObject[] = []) {
  return makeParametricScene({ sourcePrompt: 'test', region: 'downtown', objective: 'speed', objects });
}

describe('applyPatches', () => {
  it('update patch changes object property', () => {
    const scene = makeScene([makeObj()]);
    const patched = applyPatches(scene, [
      { op: 'update', objectId: 'obj-1', property: 'height', value: 8 },
    ]);
    expect(patched.objects[0].height).toBeCloseTo(8, 1);
    expect(patched.version).toBe(scene.version + 1);
  });

  it('remove patch removes object', () => {
    const scene = makeScene([makeObj({ id: 'a' }), makeObj({ id: 'b', label: 'safe-zone' })]);
    const patched = applyPatches(scene, [{ op: 'remove', objectId: 'a' }]);
    expect(patched.objects.some((o) => o.id === 'a')).toBe(false);
    expect(patched.objects.some((o) => o.id === 'b')).toBe(true);
  });

  it('ignores add op (not implemented in patch path)', () => {
    const scene = makeScene([makeObj()]);
    const patched = applyPatches(scene, [{ op: 'add', objectId: 'new-1' }]);
    expect(patched.objects).toHaveLength(1);
  });

  it('update on unknown objectId is a no-op', () => {
    const scene = makeScene([makeObj()]);
    const patched = applyPatches(scene, [
      { op: 'update', objectId: 'nonexistent', property: 'height', value: 99 },
    ]);
    expect(patched.objects[0].height).toBe(3);
  });

  it('clamps patch values to schema bounds', () => {
    const scene = makeScene([makeObj()]);
    const patched = applyPatches(scene, [
      { op: 'update', objectId: 'obj-1', property: 'height', value: 9999 },
    ]);
    expect(patched.objects[0].height).toBeLessThanOrEqual(200);
  });

  it('respects max 10 patch limit', () => {
    const scene = makeScene([makeObj()]);
    const patches = Array.from({ length: 15 }, (_, i) => ({
      op: 'update' as const,
      objectId: 'obj-1',
      property: 'height',
      value: i + 1,
    }));
    const patched = applyPatches(scene, patches);
    // 10th patch sets height to 10
    expect(patched.objects[0].height).toBe(10);
  });
});

describe('llmRefineScene (deterministic fallback — LLM disabled)', () => {
  it('falls back to deterministic engine when LLM disabled', async () => {
    const scene = makeScene([makeObj()]);
    const result = await llmRefineScene(scene, 'change loading bay material to metal');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].material).toBe('metal');
  });

  it('returns failure for unrecognized instruction', async () => {
    const scene = makeScene([makeObj()]);
    const result = await llmRefineScene(scene, 'frobnicate the splorch');
    expect(result.success).toBe(false);
  });
});
