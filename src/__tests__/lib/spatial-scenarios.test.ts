import { describe, expect, it } from 'vitest';
import { buildWorldAssetSummary, buildWorldPreview, buildWorldSceneSpec, validateWorldSceneSpec } from '@/lib/world-assets';
import { generateWorldWithProvider } from '@/lib/world-generation-adapter';
import { getWorldExportEligibility, mapSceneSpecToRenderablePrimitives } from '@/lib/world-3d';
import { hashWorldSeed, pickWorldVariant } from '@/lib/world-prompts';

describe('world generation helpers', () => {
  it('produces deterministic world seed hashes', () => {
    const prompt = 'Generate a downtown world concept with policy-safe loading corridors.';
    const first = hashWorldSeed(prompt);
    const second = hashWorldSeed(prompt);

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(0);
  });

  it('returns fallback variant when none are provided', () => {
    expect(pickWorldVariant(42, [])).toBe('Baseline world variant');
  });

  it('selects deterministic variant from a non-empty list', () => {
    const variants = ['A', 'B', 'C'] as const;
    expect(pickWorldVariant(4, variants)).toBe('B');
  });

  it('builds preview grid, scene spec, and asset summary', () => {
    const preview = buildWorldPreview({
      prompt: 'Generate a transit world concept with logistics buffers.',
      region: 'Transit District',
      style: 'mobility-corridor',
      objective: 'speed',
    });

    expect(preview.width).toBe(12);
    expect(preview.height).toBe(8);
    expect(preview.cells).toHaveLength(96);

    const assets = buildWorldAssetSummary({
      region: 'Transit District',
      style: 'mobility-corridor',
      objective: 'speed',
      simulationReady: true,
    });

    const sceneSpec = buildWorldSceneSpec({
      prompt: 'Generate a transit world concept with logistics buffers.',
      region: 'Transit District',
      style: 'mobility-corridor',
      objective: 'speed',
      providerMode: 'mock',
      availability: 'available',
      simulationReady: true,
    });

    expect(sceneSpec.primitives.length).toBeGreaterThan(10);
    expect(validateWorldSceneSpec(sceneSpec).isValid).toBe(true);
    expect(mapSceneSpecToRenderablePrimitives(sceneSpec)).toHaveLength(sceneSpec.primitives.length);
    expect(getWorldExportEligibility(sceneSpec).eligible).toBe(true);
    expect(assets.representation).toBe('3dgs-concept');
    expect(assets.simulationReadiness).toBe('ready');
  });

  it('uses provider adapter modes with fallback disclosure', async () => {
    const hyworld = await generateWorldWithProvider({
      provider: 'hyworld',
      prompt: 'Generate world with transit and curbside zones.',
      region: 'Downtown Core',
      objective: 'cost',
      style: 'logistics-grid',
      simulationReady: true,
      seed: 7,
    });

    expect(hyworld.mode).toBe('hyworld-adapter');
    expect(hyworld.availability).toBe('fallback');
    expect(hyworld.sceneSpec.providerMode).toBe('hyworld-adapter');

    const mock = await generateWorldWithProvider({
      provider: 'mock',
      prompt: 'Generate world with transit and curbside zones.',
      region: 'Downtown Core',
      objective: 'cost',
      style: 'logistics-grid',
      simulationReady: true,
      seed: 7,
    });

    expect(mock.mode).toBe('mock');
    expect(mock.availability).toBe('available');
    expect(mock.sceneSpec.exportReadiness).toBe('ready');
  });
});
