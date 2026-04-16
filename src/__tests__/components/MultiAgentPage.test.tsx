import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

vi.mock('@/lib/observability', () => ({
  generateClientTraceId: () => 'trace-hitl-test',
  createTracedFetch: () => (url: string, init: RequestInit) => fetch(url, init),
}));

import MultiAgentPage from '@/app/demos/multi-agent/page';

describe('MultiAgentPage HITL flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        website: 'https://example.com',
        total_duration_ms: 2100,
        total_tokens: 1200,
        agents: [
          { name: 'Analyzer', role: 'Technical', findings: ['A'], recommendation: 'R1', confidence: 82, duration_ms: 400, tokens: 200 },
          { name: 'Researcher', role: 'Research', findings: ['B'], recommendation: 'R2', confidence: 78, duration_ms: 700, tokens: 350 },
          { name: 'Strategist', role: 'Strategy', findings: ['C'], recommendation: 'Initial strategist plan', confidence: 80, duration_ms: 1000, tokens: 650 },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pauses at strategist approval gate with approve/revise/cancel controls', async () => {
    render(React.createElement(MultiAgentPage));

    fireEvent.click(screen.getByRole('button', { name: /Run workflow/i }));

    await waitFor(() => {
      expect(screen.getByText(/Strategist requires approval to proceed/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Paused/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/What the Strategist is about to do/i)).toBeInTheDocument();

    const reviewInput = screen.getByLabelText(/Strategist revision guidance/i);
    fireEvent.change(reviewInput, { target: { value: 'Revised strategist action for safer rollout.' } });

    fireEvent.click(screen.getByRole('button', { name: /Revise/i }));
    await waitFor(() => {
      expect(screen.getByText(/Revision applied/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Approve$/i }));

    await waitFor(() => {
      expect(screen.getByText('Revised strategist action for safer rollout.')).toBeInTheDocument();
    });
  });

  it('renders workflow rail and business value panel', () => {
    render(React.createElement(MultiAgentPage));
    expect(screen.getByText(/Workflow Stages/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Request Intake/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Human Approval/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Execution Trace/i)).toBeInTheDocument();
    expect(screen.getByText(/Business Value of This Pattern/i)).toBeInTheDocument();
  });
});
