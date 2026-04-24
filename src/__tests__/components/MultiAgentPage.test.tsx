import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

const mockFetch = vi.fn();

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
  logAPIEvent: vi.fn(),
}));

import MultiAgentPage from '@/app/demos/multi-agent/page';

describe('MultiAgentPage HITL flow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.stubGlobal('fetch', mockFetch);
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

  it('pauses at strategist approval gate with approve/revise/cancel controls', async () => {
    render(React.createElement(MultiAgentPage));

    // Use fake timers so the ~300ms of sleep() calls in the multi-agent workflow
    // complete deterministically without depending on CI wall-clock timing.
    vi.useFakeTimers();
    fireEvent.click(screen.getByLabelText(/Start multi-agent analysis workflow/i));

    // Flush the fetch + json Promise microtasks before advancing fake clock.
    // Without this, the fetch hasn't resolved yet when the timers advance.
    await Promise.resolve();
    await Promise.resolve();

    // Advance in 40ms increments so act() flushes React (orchStateRef useEffect) between each
    // batch. executeHandoff reads orchStateRef.current.handoffs after sleep(40); if React hasn't
    // flushed the preceding dispatch(REQUEST_HANDOFF), the handoff won't be found and
    // executeHandoff returns null — preventing setPendingResult from ever being called.
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(40);
      });
    }

    // Restore real timers before any subsequent async assertions.
    vi.useRealTimers();

    expect(screen.getByText(/Human Approval Required/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Approve strategist recommendation and finalize workflow/i)).toBeInTheDocument();

    expect(screen.getAllByText(/Paused/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Strategist revision guidance/i)).toBeInTheDocument();

    const reviewInput = screen.getByLabelText(/Strategist revision guidance/i);
    fireEvent.change(reviewInput, { target: { value: 'Revised strategist action for safer rollout.' } });

    fireEvent.click(screen.getByLabelText(/Apply revision guidance/i));
    await waitFor(() => {
      expect(screen.getByText(/Revision applied/i)).toBeInTheDocument();
    }, { timeout: 4000 });

    fireEvent.click(screen.getByLabelText(/Approve strategist recommendation/i));

    await waitFor(() => {
      expect(screen.getByText('Revised strategist action for safer rollout.')).toBeInTheDocument();
    }, { timeout: 4000 });
  }, 20000);

  it('renders workflow rail and business value panel', () => {
    render(React.createElement(MultiAgentPage));
    expect(screen.getByText(/Workflow Stages/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Request Intake/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Human Approval/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Execution Trace/i)).toBeInTheDocument();
    expect(screen.getByText(/Business Value of This Pattern/i)).toBeInTheDocument();
    expect(screen.getByText(/Thinking Preservation/i)).toBeInTheDocument();
  });

  it('activates deterministic fallback orchestration when API call fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    render(React.createElement(MultiAgentPage));

    fireEvent.click(screen.getByLabelText(/Start multi-agent analysis workflow/i));

    await waitFor(() => {
      expect(screen.getByText(/Fallback mode active/i)).toBeInTheDocument();
    }, { timeout: 4000 });
    expect(screen.queryByText(/API workflow request failed/i)).not.toBeInTheDocument();
  });
});
