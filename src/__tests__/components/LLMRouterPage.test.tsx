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
    expect(screen.queryByText(/Business Value Projection/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /Business Value Mode/i }));
    await waitFor(() => {
      expect(screen.getByText(/Business Value Projection/i)).toBeInTheDocument();
    });
  });
});
