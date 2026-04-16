import {
  buildWorldAssetSummary,
  buildWorldPreview,
  type WorldAssetSummary,
  type WorldPreview,
} from '@/lib/world-assets';
import { pickWorldVariant, type WorldObjective, type WorldRegion, type WorldStyle } from '@/lib/world-prompts';

export type WorldProviderMode = 'mock' | 'hyworld-adapter';

export type WorldProviderInput = {
  prompt: string;
  region: WorldRegion;
  objective: WorldObjective;
  style: WorldStyle;
  simulationReady: boolean;
  seed: number;
  imageRef?: {
    name: string;
    mimeType: string;
    width: number;
    height: number;
  };
};

export type WorldProviderOutput = {
  provider: string;
  mode: WorldProviderMode;
  availability: 'available' | 'fallback';
  worldTitle: string;
  preview: WorldPreview;
  assets: WorldAssetSummary;
  notes: string[];
};

export interface WorldGenerationProvider {
  id: string;
  generate(input: WorldProviderInput): Promise<WorldProviderOutput>;
}

class MockWorldProvider implements WorldGenerationProvider {
  id = 'mock-world-provider';

  async generate(input: WorldProviderInput): Promise<WorldProviderOutput> {
    const preview = buildWorldPreview({
      prompt: input.prompt,
      region: input.region,
      style: input.style,
      objective: input.objective,
    });

    const assets = buildWorldAssetSummary({
      region: input.region,
      style: input.style,
      objective: input.objective,
      simulationReady: input.simulationReady,
    });

    const variant = pickWorldVariant(input.seed, [
      'Curbside capacity pressure map generated.',
      'Pedestrian conflict envelope generated.',
      'Transit-linked ingress pattern generated.',
    ]);

    return {
      provider: this.id,
      mode: 'mock',
      availability: 'available',
      worldTitle: `${input.region} ${input.style} world concept`,
      preview,
      assets,
      notes: [
        'Seeded world concept generated locally for deterministic portfolio runs.',
        variant,
        input.imageRef
          ? `Image context incorporated (${input.imageRef.width}x${input.imageRef.height}).`
          : 'No image context provided; prompt-only world generation path used.',
      ],
    };
  }
}

class HyWorldAdapterProvider implements WorldGenerationProvider {
  id = 'hyworld-adapter';

  async generate(input: WorldProviderInput): Promise<WorldProviderOutput> {
    const preview = buildWorldPreview({
      prompt: input.prompt,
      region: input.region,
      style: input.style,
      objective: input.objective,
    });

    const assets = buildWorldAssetSummary({
      region: input.region,
      style: input.style,
      objective: input.objective,
      simulationReady: input.simulationReady,
    });

    return {
      provider: this.id,
      mode: 'hyworld-adapter',
      availability: 'fallback',
      worldTitle: `${input.region} adapter-backed world concept`,
      preview,
      assets,
      notes: [
        'HY-World adapter contract is wired, but upstream generation is unavailable in this public portfolio runtime.',
        'Fallback seeded world artifact generated to keep UX stable and testable.',
      ],
    };
  }
}

const PROVIDERS: Record<string, WorldGenerationProvider> = {
  mock: new MockWorldProvider(),
  hyworld: new HyWorldAdapterProvider(),
};

export async function generateWorldWithProvider(input: WorldProviderInput & { provider: 'mock' | 'hyworld' }) {
  const provider = PROVIDERS[input.provider] ?? PROVIDERS.mock;
  return provider.generate(input);
}
