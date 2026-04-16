import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProceduralWorldCanvas } from '@/components/demos/world/ProceduralWorldCanvas';
import { buildWorldSceneSpec } from '@/lib/world-assets';

describe('ProceduralWorldCanvas', () => {
  it('falls back safely when WebGL is unavailable', async () => {
    const sceneSpec = buildWorldSceneSpec({
      prompt: 'Generate a mobility district with policy-safe route corridors and pickup lanes.',
      region: 'Transit District',
      objective: 'speed',
      style: 'mobility-corridor',
      providerMode: 'mock',
      availability: 'available',
      simulationReady: true,
    });

    render(<ProceduralWorldCanvas sceneSpec={sceneSpec} resetToken={0} showOverlays={true} />);

    expect(await screen.findByTestId('world-3d-fallback')).toBeInTheDocument();
  });
});
