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
vi.mock('@huggingface/transformers', () => ({
  env: {},
  pipeline: mockPipeline,
}));

vi.mock('@/hooks/useExecutionStrategy', () => ({
  useExecutionStrategy: () => ({
    strategy: null, capability: null, mode: 'local',
    fallbackTriggered: false, fallbackReason: null,
    isRecovering: false, retryCount: 0, isReady: true,
    canAttemptLocal: true,
    triggerFallback: vi.fn(),
    resetFallback: vi.fn(),
  }),
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
  beforeEach(() => {
    vi.clearAllMocks();
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
    vi.restoreAllMocks();
  });

  it('renders local-first privacy/efficiency context', () => {
    render(React.createElement(QuantizationPage));
    expect(screen.getByText('Model Quantization Demo')).toBeInTheDocument();
    expect(screen.getByText('Runs on device')).toBeInTheDocument();
    expect(screen.getByText('Privacy-preserving local inference')).toBeInTheDocument();
    expect(screen.getByText('Local-First Inference Posture')).toBeInTheDocument();
    expect(screen.getByText(/processed in-browser/i)).toBeInTheDocument();
  });

  it('loads fp32/int8 models and computes benchmark summary', async () => {
    render(React.createElement(QuantizationPage));
    fireEvent.click(screen.getByRole('button', { name: /Load Models & Start Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter text to analyze/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter text to analyze/i), {
      target: { value: 'This product is excellent.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run Benchmark/i }));

    await waitFor(() => {
      expect(screen.getByText(/Comparison Summary/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/INT8 recommended for production/i)).toBeInTheDocument();
  });
});
