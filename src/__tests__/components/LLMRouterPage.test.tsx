import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

import LLMRouterDemo from '@/app/demos/llm-router/page';

describe('LLMRouterDemo page', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue({
      json: async () => ({
        model: 'llama-3.1-8b-instant',
        modelName: 'Llama 3.1 8B',
        provider: 'Meta',
        response: 'Test response',
        latency_ms: 420,
        input_tokens: 25,
        output_tokens: 18,
        cost_usd: 0.00002,
      }),
    });
  });

  it('renders finops routing context for executive evaluation', () => {
    render(React.createElement(LLMRouterDemo));
    expect(screen.getByText('LLM Router Demo')).toBeInTheDocument();
    expect(screen.getByText('FinOps Routing Signal')).toBeInTheDocument();
    expect(screen.getByText(/illustrative estimates/i)).toBeInTheDocument();
    expect(screen.getByText('Qwen 3.6 27B')).toBeInTheDocument();
  });

  it('shows business value projection only when business mode is enabled', async () => {
    render(React.createElement(LLMRouterDemo));

    fireEvent.change(screen.getByPlaceholderText(/Enter your prompt/i), {
      target: { value: 'What is the capital of France?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Route & Run All Models/i }));

    await waitFor(() => {
      expect(screen.getByText(/Why this route was recommended/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Routing Economics Snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated Cost \/ Request/i)).toBeInTheDocument();
    expect(screen.queryByText(/Business Value Projection/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /Business Value Mode/i }));
    await waitFor(() => {
      expect(screen.getByText(/Business Value Projection/i)).toBeInTheDocument();
    });
  });

  it('Qwen3.6-27B card contains GGUF reference', () => {
    render(React.createElement(LLMRouterDemo));
    const ggufMatches = screen.getAllByText(/GGUF/i);
    expect(ggufMatches.length).toBeGreaterThan(0);
  });

  it('HuggingFace unsloth link is present', () => {
    render(React.createElement(LLMRouterDemo));
    const link = screen.getByRole('link', { name: /HuggingFace/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://huggingface.co/unsloth/Qwen3.6-27B-GGUF');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('"Local" badge or text is present on Qwen3.6-27B card', () => {
    render(React.createElement(LLMRouterDemo));
    const localMatches = screen.getAllByText(/GGUF \/ Local|Local Deployment/i);
    expect(localMatches.length).toBeGreaterThan(0);
  });

  it('falls back to deterministic estimates when the live routed call is rate limited', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too many requests' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'qwen-moe-local',
          modelName: 'Qwen MoE local',
          provider: 'Local',
          response: '',
          latency_ms: 0,
          input_tokens: 0,
          output_tokens: 0,
          cost_usd: 0,
          isFallback: true,
          error: 'Local inference unavailable.',
        }),
      });

    render(React.createElement(LLMRouterDemo));

    fireEvent.change(screen.getByPlaceholderText(/Enter your prompt/i), {
      target: { value: 'What is the capital of France?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Route & Run All Models/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Estimated comparison/i).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/Error: Too many requests/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Live route temporarily rate-limited/i)).toBeInTheDocument();
  });
});
