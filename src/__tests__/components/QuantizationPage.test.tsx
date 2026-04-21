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

import QuantizationPage from '@/app/demos/quantization/page';

describe('QuantizationPage', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    mockExecReturn = makeExecState();

    mockFetch.mockResolvedValue({ ok: true });

    mockPipeline.mockImplementation(async () => {
      return async () => [{ label: 'POSITIVE', score: 0.93 }];
    });

    let tick = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      tick += 12;
      return tick;
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('successful model/runtime init renders ready benchmark state', async () => {
    render(React.createElement(QuantizationPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter text to analyze/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Run Benchmark/i })).toBeInTheDocument();
    });
  });

  it('successful local benchmark run renders full FP32 vs INT8 comparison', async () => {
    render(React.createElement(QuantizationPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Run Benchmark/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter text to analyze/i), {
      target: { value: 'This product is excellent.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByText(/Comparison Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/Speed Improvement/i)).toBeInTheDocument();
      expect(screen.getByText(/INT8 recommended for production/i)).toBeInTheDocument();
    }, { timeout: 4000 });
  });

  it('rejected backend/model init shows graceful fallback UI', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('backend init failed'));
    render(React.createElement(QuantizationPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByText('Local Benchmark Models Unavailable')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry Initialization/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Use Simulated Benchmark Mode/i })).toBeInTheDocument();
    });
  });

  it('failed WASM/model fetch shows fallback UI instead of raw crash text', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('no available backend found. ERR: [wasm] TypeError: Failed to fetch'));
    render(React.createElement(QuantizationPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByText('Local Benchmark Models Unavailable')).toBeInTheDocument();
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
      return async () => [{ label: 'POSITIVE', score: 0.93 }];
    });

    render(React.createElement(QuantizationPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retry Initialization/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Retry Initialization/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Run Benchmark/i })).toBeInTheDocument();
    });
    expect(mockPipeline).toHaveBeenCalledTimes(3);
  });

  it('simulated benchmark mode works when local init fails', async () => {
    mockPipeline.mockRejectedValue(new Error('Failed to fetch'));
    render(React.createElement(QuantizationPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Use Simulated Benchmark Mode/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Use Simulated Benchmark Mode/i }));

    await waitFor(() => {
      expect(screen.getByText(/Simulated benchmark mode is active/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Run Benchmark/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter text to analyze/i), {
      target: { value: 'This product is excellent.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByText(/Comparison Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/INT8 recommended for production/i)).toBeInTheDocument();
    }, { timeout: 4000 });
  });

  it('benchmark controls recover after failed init and are not permanently dead', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('Failed to fetch'));
    render(React.createElement(QuantizationPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Use Simulated Benchmark Mode/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Use Simulated Benchmark Mode/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Run Benchmark/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter text to analyze/i), {
      target: { value: 'I love this product.' },
    });

    const runButton = screen.getByRole('button', { name: /Run Benchmark/i });
    expect(runButton).toBeEnabled();
  });

  it('does not emit setState-after-unmount warnings during in-flight init', async () => {
    let resolvePipeline: ((value: any) => void) | null = null;
    const deferred = new Promise((resolve) => {
      resolvePipeline = resolve;
    });

    mockPipeline.mockImplementationOnce(() => deferred as any);

    const { unmount } = render(React.createElement(QuantizationPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));

    await waitFor(() => {
      expect(mockPipeline).toHaveBeenCalledTimes(1);
    });

    unmount();
    resolvePipeline?.(async () => [{ label: 'POSITIVE', score: 0.93 }]);
    await Promise.resolve();

    const warningCalls = consoleErrorSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes("Can't perform a React state update on an unmounted component"),
    );
    expect(warningCalls).toHaveLength(0);
  });

  it('non-fetch init errors use backend-unavailable fallback message', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('WebGPU backend failed to initialize'));
    render(React.createElement(QuantizationPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));
    await waitFor(() => {
      expect(screen.getByText('Local Benchmark Models Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/compatible browser inference backend/i)).toBeInTheDocument();
    });
  });

  it('unexpected init errors show initialization-failed fallback copy', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('unexpected runtime crash'));
    render(React.createElement(QuantizationPage));

    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed to initialize in this browser session/i)).toBeInTheDocument();
    });
  });

  it('mobile/low-capability path starts simulated benchmark mode from idle', async () => {
    mockExecReturn = makeExecState({ canAttemptLocal: false, mode: 'simulated' });
    render(React.createElement(QuantizationPage));

    fireEvent.click(screen.getByRole('button', { name: /Try Simulated Benchmark/i }));
    await waitFor(() => {
      expect(screen.getByText(/Simulated benchmark mode is active/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Run Benchmark/i })).toBeInTheDocument();
    });
  });

  it('attempts non-wasm browser backends when capabilities are present', async () => {
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: {} });
    Object.defineProperty(navigator, 'ml', { configurable: true, value: {} });

    render(React.createElement(QuantizationPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Run Benchmark/i })).toBeInTheDocument();
    });
  });

  it('shows recoverable error if benchmark inference fails after successful init', async () => {
    mockPipeline.mockImplementation(async (_task: string, _model: string, opts?: { dtype?: string }) => {
      if (opts?.dtype === 'fp32') {
        return async () => {
          throw new Error('Inference crashed');
        };
      }
      return async () => [{ label: 'POSITIVE', score: 0.93 }];
    });

    render(React.createElement(QuantizationPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Run Benchmark/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter text to analyze/i), {
      target: { value: 'This product is excellent.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByText(/Inference crashed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Run Benchmark/i })).toBeInTheDocument();
    }, { timeout: 4000 });
  });
});
