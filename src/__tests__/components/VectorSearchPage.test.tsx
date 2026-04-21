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

import VectorSearchPage from '@/app/demos/vector-search/page';

describe('VectorSearchPage', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    mockExecReturn = makeExecState();

    mockFetch.mockResolvedValue({ ok: true });

    mockPipeline.mockImplementation(async () => {
      return async (input: string) => {
        const len = Math.max(1, input.length % 11);
        return {
          data: new Float32Array([len / 10, 0.4, 0.2, 0.1]),
        };
      };
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('successful embedding init renders interactive search UI', async () => {
    render(React.createElement(VectorSearchPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Model & Start/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Search$/i })).toBeInTheDocument();
      expect(screen.getByText(/Embedding Space/i)).toBeInTheDocument();
    });
  });

  it('shows graceful fallback UI when backend/model init rejects', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('no available backend found. ERR: [wasm] TypeError: Failed to fetch'));
    render(React.createElement(VectorSearchPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Model & Start/i }));

    await waitFor(() => {
      expect(screen.getByText('Local Semantic Model Unavailable')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry Initialization/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Use Fallback Sample Mode/i })).toBeInTheDocument();
    });
  });

  it('failed model asset fetch shows fallback UI without raw crash text', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('no available backend found. ERR: [wasm] TypeError: Failed to fetch'));
    render(React.createElement(VectorSearchPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Model & Start/i }));

    await waitFor(() => {
      expect(screen.getByText('Local Semantic Model Unavailable')).toBeInTheDocument();
    });
    expect(screen.queryByText(/no available backend found/i)).not.toBeInTheDocument();
  });

  it('retry triggers a fresh initialization attempt', async () => {
    let calls = 0;
    mockPipeline.mockImplementation(async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error('Failed to fetch');
      }
      return async (input: string) => ({
        data: new Float32Array([Math.max(0.1, input.length / 100), 0.2, 0.3]),
      });
    });

    render(React.createElement(VectorSearchPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Model & Start/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retry Initialization/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Retry Initialization/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Search$/i })).toBeInTheDocument();
    });
    expect(mockPipeline).toHaveBeenCalledTimes(2);
  });

  it('fallback sample mode remains usable when local init fails', async () => {
    mockPipeline.mockRejectedValue(new Error('Failed to fetch'));
    render(React.createElement(VectorSearchPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Model & Start/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Use Fallback Sample Mode/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Use Fallback Sample Mode/i }));

    await waitFor(() => {
      expect(screen.getByText(/Fallback sample mode is active/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Search$/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/What is Prasad's AI experience/i), {
      target: { value: 'AI platform leadership' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Top 5 Retrieved Documents/i)).toBeInTheDocument();
    });
  });

  it('does not emit setState-on-unmounted warnings for in-flight init', async () => {
    let resolvePipeline: ((value: any) => void) | null = null;
    const deferred = new Promise((resolve) => {
      resolvePipeline = resolve;
    });

    mockPipeline.mockImplementationOnce(() => deferred as any);

    const { unmount } = render(React.createElement(VectorSearchPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Model & Start/i }));

    await waitFor(() => {
      expect(mockPipeline).toHaveBeenCalledTimes(1);
    });

    unmount();
    resolvePipeline?.(async () => ({ data: new Float32Array([0.1, 0.2, 0.3]) }));
    await Promise.resolve();

    const warningCalls = consoleErrorSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes("Can't perform a React state update on an unmounted component"),
    );
    expect(warningCalls).toHaveLength(0);
  });
});
