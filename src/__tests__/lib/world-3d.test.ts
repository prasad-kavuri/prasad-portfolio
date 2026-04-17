import { describe, expect, it } from 'vitest';
import { buildWorldSceneSpec } from '@/lib/world-assets';
import {
  buildWorldExportFileName,
  getWorldExportEligibility,
  getWorldSceneComplexity,
  mapSceneSpecToRenderablePrimitives,
} from '@/lib/world-3d';

describe('world 3D rendering helpers', () => {
  const sceneSpec = buildWorldSceneSpec({
    prompt: 'Generate a downtown mobility zone with pickup corridors and safety buffers.',
    region: 'Downtown Core',
    objective: 'speed',
    style: 'logistics-grid',
    providerMode: 'mock',
    availability: 'available',
    simulationReady: true,
  });

  it('maps scene specification to renderable primitives deterministically', () => {
    const first = mapSceneSpecToRenderablePrimitives(sceneSpec);
    const second = mapSceneSpecToRenderablePrimitives(sceneSpec);

    expect(first).toEqual(second);
    expect(first.length).toBe(sceneSpec.primitives.length);
    expect(first[0].size.height).toBeGreaterThan(0);
  });

  it('applies deterministic height variation by primitive kind', () => {
    const renderables = mapSceneSpecToRenderablePrimitives(sceneSpec);
    const structures = renderables.filter((item) => item.kind === 'structure');
    const corridors = renderables.filter((item) => item.kind === 'corridor');
    const operationsCore = renderables.find((item) => item.id === 'ops-core');
    const pickupZone = renderables.find((item) => item.id === 'pickup');

    expect(structures.length).toBeGreaterThan(0);
    expect(corridors.length).toBeGreaterThan(0);
    expect(Math.max(...structures.map((item) => item.size.height))).toBeGreaterThan(
      Math.max(...corridors.map((item) => item.size.height))
    );
    expect(new Set(structures.map((item) => item.size.height)).size).toBeGreaterThan(1);
    expect(operationsCore).toBeDefined();
    expect(pickupZone).toBeDefined();
    expect((operationsCore?.size.height ?? 0)).toBeGreaterThan(pickupZone?.size.height ?? 0);
  });

  it('reports complexity against primitive budget', () => {
    const complexity = getWorldSceneComplexity(sceneSpec);
    expect(complexity.primitiveCount).toBe(sceneSpec.primitives.length);
    expect(complexity.budget).toBe(sceneSpec.primitiveBudget);
    expect(complexity.isWithinBudget).toBe(true);
  });

  it('calculates export eligibility and blocks review-only scenes', () => {
    expect(getWorldExportEligibility(sceneSpec).eligible).toBe(true);

    const reviewSpec = {
      ...sceneSpec,
      exportReadiness: 'review' as const,
    };
    const blocked = getWorldExportEligibility(reviewSpec);

    expect(blocked.eligible).toBe(false);
    expect(blocked.reasons).toContain('scene_export_readiness_review');
  });

  it('builds deterministic GLB file names', () => {
    expect(buildWorldExportFileName(sceneSpec)).toMatch(/^world-downtown-core-logistics-grid-world-[a-f0-9]+\.glb$/);
  });
});
