import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

const mockPipeline = vi.fn();
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('@huggingface/transformers', () => ({
  env: {},
  pipeline: mockPipeline,
}));

import MultimodalPage from '@/app/demos/multimodal/page';

describe('MultimodalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPipeline.mockImplementation(async (task: string) => {
      if (task === 'image-classification') {
        return async () => [{ label: 'cat', score: 0.92 }];
      }
      return async (_img: string, labels: string[]) =>
        labels.map((label, i) => ({ label, score: i === 0 ? 0.91 : 0.42 }));
    });
    mockFetch.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['img']),
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-image');
    // Stub WebGPU so useBrowserAI(requiresWebGPU=true) doesn't block on no-webgpu in JSDOM
    Object.defineProperty(navigator, 'gpu', { value: {}, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
  });

  it('renders local inference privacy badges', () => {
    render(React.createElement(MultimodalPage));
    expect(screen.getByText('Multimodal AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('In-browser inference')).toBeInTheDocument();
    expect(screen.getByText('Image analysis stays local after load')).toBeInTheDocument();
  });

  it('loads models, ingests URL image, and returns classification output', async () => {
    render(React.createElement(MultimodalPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start/i }));
    await waitFor(() => {
      expect(screen.getByText(/Drag & drop an image/i)).toBeInTheDocument();
    });

    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com\/image.jpg/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com/test.jpg' } });
    fireEvent.click(screen.getByRole('button', { name: /^Load$/i }));

    await waitFor(() => {
      expect(screen.getByText('Classify Image')).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Classify Image/i })[0]);

    await waitFor(() => {
      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('cat')).toBeInTheDocument();
    });
  });

  it('shows iOS warning banner when iOS UA is detected', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      configurable: true,
    });

    render(React.createElement(MultimodalPage));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('iOS Device — Showing Simulated Demo')).toBeInTheDocument();

    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
  });

  it('shows hard block warning when deviceMemory < 4', () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });

    render(React.createElement(MultimodalPage));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Low Memory \(2GB\)/i)).toBeInTheDocument();

    Object.defineProperty(navigator, 'deviceMemory', { value: undefined, configurable: true });
  });

  it('shows soft warning when deviceMemory is 4-7GB', () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 4, configurable: true });

    render(React.createElement(MultimodalPage));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Limited Memory \(4GB\)/i)).toBeInTheDocument();

    Object.defineProperty(navigator, 'deviceMemory', { value: undefined, configurable: true });
  });

  it('does not show warning on desktop with sufficient memory', () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 16, configurable: true });

    render(React.createElement(MultimodalPage));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    Object.defineProperty(navigator, 'deviceMemory', { value: undefined, configurable: true });
  });
});
