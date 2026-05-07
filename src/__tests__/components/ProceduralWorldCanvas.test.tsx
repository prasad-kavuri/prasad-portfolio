import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProceduralWorldCanvas } from '@/components/demos/world/ProceduralWorldCanvas';
import { buildWorldSceneSpec } from '@/lib/world-assets';

describe('ProceduralWorldCanvas', () => {
  function sceneSpec() {
    return buildWorldSceneSpec({
      prompt: 'Generate a mobility district with policy-safe route corridors and pickup lanes.',
      region: 'Transit District',
      objective: 'speed',
      style: 'mobility-corridor',
      providerMode: 'mock',
      availability: 'available',
      simulationReady: true,
    });
  }

  it('falls back safely when WebGL is unavailable', async () => {
    const spec = sceneSpec();
    const { rerender } = render(<ProceduralWorldCanvas sceneSpec={spec} resetToken={0} showOverlays={true} />);

    expect(await screen.findByTestId('world-3d-fallback')).toBeInTheDocument();
    rerender(<ProceduralWorldCanvas sceneSpec={spec} resetToken={1} showOverlays={false} />);
    expect(await screen.findByTestId('world-3d-fallback')).toBeInTheDocument();
  });

  it('uses the mobile stability fallback on narrow screens', async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 720, configurable: true });

    render(<ProceduralWorldCanvas sceneSpec={sceneSpec()} resetToken={0} showOverlays={true} />);

    expect(await screen.findByText(/Mobile fallback is active/)).toBeInTheDocument();
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
  });
});
