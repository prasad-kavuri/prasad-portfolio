import { describe, it, expect } from 'vitest';
import { applyRefinement } from '@/lib/spatial/refinement-engine';
import type { ParametricScene, SpatialObject } from '@/lib/spatial/scene-schema';

function makeObj(overrides: Partial<SpatialObject> = {}): SpatialObject {
  return {
    id: 'obj-1',
    type: 'block',
    label: 'loading bay',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    width: 5,
    height: 3,
    depth: 4,
    ...overrides,
  };
}

function makeScene(objects: SpatialObject[] = []): ParametricScene {
  return {
    id: 'scene-1',
    version: 1,
    sourcePrompt: 'test',
    region: 'downtown',
    objective: 'speed',
    objects: objects.length ? objects : [makeObj()],
    generatedAt: new Date().toISOString(),
    refinementHistory: [],
  };
}

describe('applyRefinement — scale (shorter/narrower/default branches)', () => {
  it('make the loading bay 20% shorter', () => {
    const scene = makeScene([makeObj({ height: 4 })]);
    const result = applyRefinement(scene, 'make the loading bay 20% shorter');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].height).toBeCloseTo(4 * 0.8, 1);
  });

  it('make the loading bay 20% smaller', () => {
    const scene = makeScene([makeObj({ height: 4 })]);
    const result = applyRefinement(scene, 'make the loading bay 20% smaller');
    expect(result.success).toBe(true);
  });

  it('make the loading bay 20% narrower', () => {
    const scene = makeScene([makeObj({ width: 5 })]);
    const result = applyRefinement(scene, 'make the loading bay 20% narrower');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].width).toBeCloseTo(5 * 0.8, 1);
  });
});

describe('applyRefinement — scale', () => {
  it('make the loading bay 20% taller', () => {
    const scene = makeScene([makeObj({ height: 3 })]);
    const result = applyRefinement(scene, 'make the loading bay 20% taller');
    expect(result.success).toBe(true);
    const obj = result.scene!.objects[0];
    expect(obj.height).toBeCloseTo(3.6, 2);
  });

  it('make the loading bay 50% wider', () => {
    const scene = makeScene([makeObj({ width: 4 })]);
    const result = applyRefinement(scene, 'make the loading bay 50% wider');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].width).toBeCloseTo(6, 1);
  });

  it('value clamping: height would exceed 200 → clamped to 200', () => {
    const scene = makeScene([makeObj({ height: 190 })]);
    const result = applyRefinement(scene, 'make the loading bay 50% taller');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].height).toBeLessThanOrEqual(200);
  });
});

describe('applyRefinement — move', () => {
  it('move the loading bay 5 meters north → z decreases', () => {
    const scene = makeScene([makeObj({ position: { x: 0, y: 0, z: 0 } })]);
    const result = applyRefinement(scene, 'move the loading bay north 5 meters');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].position.z).toBeCloseTo(-5, 1);
  });

  it('move the loading bay 3 meters east → x increases', () => {
    const scene = makeScene([makeObj({ position: { x: 0, y: 0, z: 0 } })]);
    const result = applyRefinement(scene, 'move the loading bay east 3 meters');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].position.x).toBeCloseTo(3, 1);
  });
});

describe('applyRefinement — material', () => {
  it('change loading bay material to metal', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'change loading bay material to metal');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].material).toBe('metal');
  });

  it('invalid material returns failure', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'change loading bay material to titanium');
    expect(result.success).toBe(false);
  });
});

describe('applyRefinement — add', () => {
  it('add a platform on the left → new object appended', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'add a platform on the left');
    expect(result.success).toBe(true);
    expect(result.scene!.objects).toHaveLength(2);
    expect(result.scene!.objects[1].type).toBe('platform');
  });

  it('add a node → appended with node type', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'add a node');
    expect(result.success).toBe(true);
    expect(result.scene!.objects.some((o) => o.type === 'node')).toBe(true);
  });
});

describe('applyRefinement — remove', () => {
  it('remove congestion-point-1 → object removed', () => {
    const scene = makeScene([
      makeObj({ id: 'cp1', label: 'congestion-point-1' }),
      makeObj({ id: 'cp2', label: 'safe-zone' }),
    ]);
    const result = applyRefinement(scene, 'remove congestion-point-1');
    expect(result.success).toBe(true);
    expect(result.scene!.objects.some((o) => o.id === 'cp1')).toBe(false);
    expect(result.scene!.objects.some((o) => o.id === 'cp2')).toBe(true);
  });
});

describe('applyRefinement — scale by meters', () => {
  it('make the loading bay 2 meters taller', () => {
    const scene = makeScene([makeObj({ height: 3 })]);
    const result = applyRefinement(scene, 'make the loading bay 2 meters taller');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].height).toBeCloseTo(5, 1);
  });
});

describe('applyRefinement — set property', () => {
  it('set loading bay height to 10', () => {
    const scene = makeScene([makeObj({ height: 3 })]);
    const result = applyRefinement(scene, 'set loading bay height to 10');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].height).toBeCloseTo(10, 1);
  });

  it('set loading bay width to 8', () => {
    const scene = makeScene([makeObj({ width: 4 })]);
    const result = applyRefinement(scene, 'set loading bay width to 8');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].width).toBeCloseTo(8, 1);
  });

  it('set — no match returns failure', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'set xyz height to 10');
    expect(result.success).toBe(false);
  });
});

describe('applyRefinement — sim-ready', () => {
  it('mark loading bay as simulation-ready', () => {
    const scene = makeScene([makeObj({ simulationReady: false })]);
    const result = applyRefinement(scene, 'mark loading bay as simulation-ready');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].simulationReady).toBe(true);
  });

  it('mark — no match returns failure', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'mark xyz as simulation-ready');
    expect(result.success).toBe(false);
  });
});

describe('applyRefinement — policy', () => {
  it('apply safety-first policy to loading bay', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'apply safety-first policy to loading bay');
    expect(result.success).toBe(true);
    expect(result.scene!.objects[0].policy).toBe('safety-first');
  });

  it('policy — no match returns failure', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'apply ada policy to xyz');
    expect(result.success).toBe(false);
  });
});

describe('applyRefinement — add with location', () => {
  it('add a block on the right → positive x offset', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'add a block on the right');
    expect(result.success).toBe(true);
    const newObj = result.scene!.objects.find((o) => o.type === 'block' && o.id !== 'obj-1');
    expect(newObj?.position.x).toBeGreaterThan(0);
  });

  it('add invalid type returns failure', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'add a skyscraper');
    expect(result.success).toBe(false);
  });
});

describe('applyRefinement — no-target branches', () => {
  it('scale — no object found returns failure', () => {
    const scene = makeScene([makeObj({ label: 'something-else' })]);
    const result = applyRefinement(scene, 'make the loading bay 10% taller');
    // Falls through to unrecognized since label match fails
    expect(result.success).toBe(false);
  });

  it('move — no object found returns failure', () => {
    const scene = makeScene([makeObj({ label: 'dock' })]);
    const result = applyRefinement(scene, 'move the xyz north 5 meters');
    expect(result.success).toBe(false);
  });

  it('remove — no object found returns failure', () => {
    const scene = makeScene([makeObj({ label: 'dock' })]);
    const result = applyRefinement(scene, 'remove nonexistent-thing');
    expect(result.success).toBe(false);
  });
});

describe('applyRefinement — unrecognized', () => {
  it('unrecognized instruction returns { success: false }', () => {
    const scene = makeScene();
    const result = applyRefinement(scene, 'blarg frob the widget sideways');
    expect(result.success).toBe(false);
    expect(result.reason).toBe('unrecognized instruction');
    expect(result.fallbackSuggestions).toBeDefined();
  });
});

describe('applyRefinement — sequential', () => {
  it('multiple sequential refinements maintain correct state', () => {
    let scene = makeScene([makeObj({ height: 2, width: 3 })]);
    const r1 = applyRefinement(scene, 'make the loading bay 50% taller');
    expect(r1.success).toBe(true);
    scene = r1.scene!;
    expect(scene.objects[0].height).toBeCloseTo(3, 1);

    const r2 = applyRefinement(scene, 'change loading bay material to concrete');
    expect(r2.success).toBe(true);
    scene = r2.scene!;
    expect(scene.objects[0].material).toBe('concrete');
    expect(scene.objects[0].height).toBeCloseTo(3, 1); // previous change preserved
    expect(scene.version).toBe(3);
  });
});
