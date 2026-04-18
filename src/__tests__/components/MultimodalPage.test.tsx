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

// Default execution state — capable desktop, local mode
const makeExecState = (overrides: Record<string, unknown> = {}) => ({
  strategy: null, capability: null, mode: 'local',
  fallbackTriggered: false, fallbackReason: null,
  isRecovering: false, retryCount: 0, isReady: true,
  canAttemptLocal: true,
  triggerFallback: vi.fn(),
  resetFallback: vi.fn(),
  ...overrides,
});

let mockExecReturn = makeExecState();

vi.mock('@/hooks/useExecutionStrategy', () => ({
  useExecutionStrategy: () => mockExecReturn,
  INFERENCE_TIMEOUT_MS: 10_000,
}));

vi.mock('@/lib/stability-monitor', () => ({
  withStabilityMonitor: async (fn: () => Promise<unknown>) => {
    try {
      const value = await fn();
      return { ok: true, value, durationMs: 0 };
    } catch (error) {
      return { ok: false, reason: 'unknown', error };
    }
  },
}));

import MultimodalPage from '@/app/demos/multimodal/page';

describe('MultimodalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecReturn = makeExecState();
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('shows simulated-mode notice when routed to simulated (e.g. iOS)', () => {
    mockExecReturn = makeExecState({ canAttemptLocal: false, mode: 'simulated' });

    render(React.createElement(MultimodalPage));

    // CapabilityNotice renders role="status" with the simulated walkthrough message
    expect(screen.getByText('Multimodal Assistant: Simulated walkthrough')).toBeInTheDocument();
  });

  it('shows simulated-mode notice when device capability is too low', () => {
    mockExecReturn = makeExecState({ canAttemptLocal: false, mode: 'simulated' });

    render(React.createElement(MultimodalPage));

    expect(screen.getByText('Multimodal Assistant: Simulated walkthrough')).toBeInTheDocument();
    // Simulated path exposes the "Try Simulated Demo" button
    expect(screen.getByRole('button', { name: /Try Simulated Demo/i })).toBeInTheDocument();
  });

  it('does not show capability notice for capable devices in local mode', () => {
    // Default mockExecReturn has mode='local' — CapabilityNotice is silent
    render(React.createElement(MultimodalPage));

    expect(screen.queryByText(/Simulated walkthrough/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cloud AI active/i)).not.toBeInTheDocument();
  });

  it('does not show simulated notice when device is capable', () => {
    // Explicitly high-capability mock
    mockExecReturn = makeExecState({ canAttemptLocal: true, mode: 'local' });

    render(React.createElement(MultimodalPage));

    expect(screen.queryByText(/Simulated walkthrough/i)).not.toBeInTheDocument();
  });
});
