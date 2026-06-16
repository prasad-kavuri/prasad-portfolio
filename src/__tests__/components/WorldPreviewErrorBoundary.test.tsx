import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { WorldPreviewErrorBoundary } from '@/components/demos/world/WorldPreviewErrorBoundary';

function ThrowingPreview(): React.ReactNode {
  throw new Error('preview failed');
}

describe('WorldPreviewErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children until a preview error occurs', () => {
    render(
      <WorldPreviewErrorBoundary worldId="world-1">
        <div>Preview ready</div>
      </WorldPreviewErrorBoundary>
    );

    expect(screen.getByText('Preview ready')).toBeInTheDocument();
  });

  it('shows the fallback and logs preview debug context when rendering fails', () => {
    render(
      <WorldPreviewErrorBoundary worldId="world-1">
        <ThrowingPreview />
      </WorldPreviewErrorBoundary>
    );

    expect(screen.getByText(/Preview temporarily unavailable/)).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith(
      '[world-generation-debug] preview.render_error',
      expect.objectContaining({ worldId: 'world-1', message: 'preview failed' })
    );
  });

  it('recovers when the generated world id changes', () => {
    const { rerender } = render(
      <WorldPreviewErrorBoundary worldId="world-1">
        <ThrowingPreview />
      </WorldPreviewErrorBoundary>
    );

    expect(screen.getByText(/Preview temporarily unavailable/)).toBeInTheDocument();

    rerender(
      <WorldPreviewErrorBoundary worldId="world-2">
        <div>Recovered preview</div>
      </WorldPreviewErrorBoundary>
    );

    expect(screen.getByText('Recovered preview')).toBeInTheDocument();
  });
});
