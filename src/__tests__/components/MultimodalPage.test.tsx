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
  RawImage: {
    fromBlob: async (blob: Blob) => blob,
  },
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
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
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
    consoleErrorSpy.mockRestore();
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

  it('shows graceful fallback card when backend init rejects', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('no available backend found. ERR: [wasm] TypeError: Failed to fetch'));
    render(React.createElement(MultimodalPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start/i }));

    await waitFor(() => {
      expect(screen.getByText('Local Inference Assets Unavailable')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry Initialization/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to Simulated Demo/i })).toBeInTheDocument();
    });
  });

  it('does not render raw crash text when model asset fetch fails', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('no available backend found. ERR: [wasm] TypeError: Failed to fetch'));
    render(React.createElement(MultimodalPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start/i }));

    await waitFor(() => {
      expect(screen.getByText('Local Inference Assets Unavailable')).toBeInTheDocument();
    });
    expect(screen.queryByText(/no available backend found/i)).not.toBeInTheDocument();
  });

  it('retry re-attempts initialization from scratch', async () => {
    let calls = 0;
    mockPipeline.mockImplementation(async (task: string) => {
      calls += 1;
      if (calls === 1) {
        throw new Error('Failed to fetch');
      }
      if (task === 'image-classification') {
        return async () => [{ label: 'cat', score: 0.92 }];
      }
      return async (_img: string, labels: string[]) =>
        labels.map((label, i) => ({ label, score: i === 0 ? 0.91 : 0.42 }));
    });

    render(React.createElement(MultimodalPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retry Initialization/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Retry Initialization/i }));

    await waitFor(() => {
      expect(screen.getByText(/Drag & drop an image/i)).toBeInTheDocument();
    });
    expect(mockPipeline).toHaveBeenCalledTimes(3);
  });

  it('switches to simulated mode when backend init fails', async () => {
    mockPipeline.mockRejectedValue(new Error('Failed to fetch'));
    render(React.createElement(MultimodalPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Switch to Simulated Demo/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Switch to Simulated Demo/i }));

    await waitFor(() => {
      expect(screen.getByText(/Simulated demo mode is active/i)).toBeInTheDocument();
      expect(screen.getByText(/Drag & drop an image/i)).toBeInTheDocument();
    });
  });

  it('avoids setState-on-unmounted warnings during in-flight initialization', async () => {
    let resolvePipeline: ((value: any) => void) | null = null;
    const deferred = new Promise((resolve) => {
      resolvePipeline = resolve;
    });
    mockPipeline.mockImplementationOnce(() => deferred as any);

    const { unmount } = render(React.createElement(MultimodalPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start/i }));

    await waitFor(() => {
      expect(mockPipeline).toHaveBeenCalledTimes(1);
    });
    unmount();
    resolvePipeline?.(async () => [{ label: 'cat', score: 0.92 }]);
    await Promise.resolve();

    const warningCalls = consoleErrorSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes("Can't perform a React state update on an unmounted component"),
    );
    expect(warningCalls).toHaveLength(0);
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

  it('handles invalid zero-shot labels with inline validation error', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: /Zero-Shot/i }));
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. cat, dog/i), {
      target: { value: ',,,   ,' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Classify Image/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Please enter at least one label/i)).toBeInTheDocument();
    });
  });

  it('handles image URL fetch failure with user-friendly error', async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('broken.jpg')) {
        return {
          ok: false,
          blob: async () => new Blob(['bad']),
        } as any;
      }
      return {
        ok: true,
        blob: async () => new Blob(['img']),
      } as any;
    });
    render(React.createElement(MultimodalPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start/i }));

    await waitFor(() => {
      expect(screen.getByText(/Drag & drop an image/i)).toBeInTheDocument();
    });

    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com\/image.jpg/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com/broken.jpg' } });
    fireEvent.click(screen.getByRole('button', { name: /^Load$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Could not load URL/i)).toBeInTheDocument();
    });
  });

  it('runs class/zero-shot flow in simulated mode when local inference is unavailable', async () => {
    mockExecReturn = makeExecState({ canAttemptLocal: false, mode: 'simulated' });
    render(React.createElement(MultimodalPage));

    fireEvent.click(screen.getByRole('button', { name: /Try Simulated Demo/i }));
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
      expect(screen.getByText('person')).toBeInTheDocument();
    });
  });

  it('attempts non-wasm browser backends when capability hints are available', async () => {
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: {} });
    Object.defineProperty(navigator, 'ml', { configurable: true, value: {} });

    render(React.createElement(MultimodalPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start/i }));

    await waitFor(() => {
      expect(screen.getByText(/Drag & drop an image/i)).toBeInTheDocument();
    });
  });

  it('keeps degraded recovery options available when retry also fails', async () => {
    mockPipeline.mockRejectedValue(new Error('backend failed'));
    render(React.createElement(MultimodalPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retry Initialization/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Retry Initialization/i }));
    await waitFor(() => {
      expect(screen.getByText(/Local Inference/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to Simulated Demo/i })).toBeInTheDocument();
    });
  });

  it('continues initialization when a backend attempt fails but a later one succeeds', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('unexpected runtime crash'));
    render(React.createElement(MultimodalPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start/i }));
    await waitFor(() => {
      expect(screen.getByText(/Drag & drop an image/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('Local Inference Startup Failed')).not.toBeInTheDocument();
  });

  it('renders execution mode toast when recovery state is active', () => {
    mockExecReturn = makeExecState({ fallbackTriggered: true, isRecovering: true });
    render(React.createElement(MultimodalPage));
    expect(screen.getByText(/Switched to simulated mode/i)).toBeInTheDocument();
  });
});
