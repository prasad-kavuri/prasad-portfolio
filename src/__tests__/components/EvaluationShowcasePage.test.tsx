import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', null, 'Toggle'),
}));

import EvaluationShowcasePage from '@/app/demos/evaluation-showcase/page';

describe('EvaluationShowcasePage', () => {
  it('switches Scenario Explorer tabs and renders drift + hitl states', () => {
    render(React.createElement(EvaluationShowcasePage));

    expect(screen.getAllByText(/All systems healthy/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /High-Latency Drift Event/i }));
    expect(screen.getByText(/Model degradation detected/i)).toBeInTheDocument();
    expect(screen.getByText(/CI Gate: BLOCKED/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /HITL Checkpoint/i }));
    expect(screen.getByText(/Awaiting human review before Strategist proceeds/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve & Continue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject & Revise/i })).toBeInTheDocument();
  });

  it('handles HITL approve and reject flows with reset', () => {
    render(React.createElement(EvaluationShowcasePage));

    fireEvent.click(screen.getByRole('button', { name: /HITL Checkpoint/i }));
    fireEvent.click(screen.getByRole('button', { name: /Approve & Continue/i }));
    expect(screen.getByText(/HITL checkpoint passed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    fireEvent.click(screen.getByRole('button', { name: /Reject & Revise/i }));
    expect(screen.getByText(/Revision request sent/i)).toBeInTheDocument();
  });

  it('toggles Offline vs Online eval modes', () => {
    render(React.createElement(EvaluationShowcasePage));

    expect(screen.getAllByText(/27-case golden dataset/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/eval-001/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Online — live sampling/i }));
    expect(screen.getByText(/1% traffic sample/i)).toBeInTheDocument();
    expect(screen.getByText(/Ignore previous instructions/i)).toBeInTheDocument();
    expect(screen.getAllByText(/blocked/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Offline — batch/i }));
    expect(screen.getByText(/avg fidelity 0.896/i)).toBeInTheDocument();
  });

  it('runs judge scoring and reveals final weighted metrics', () => {
    vi.useFakeTimers();
    render(React.createElement(EvaluationShowcasePage));

    fireEvent.click(screen.getByRole('button', { name: /Run Judge Scoring/i }));
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText(/Weighted avg/i)).toBeInTheDocument();
    expect(screen.getByText('0.95')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Re-run Judge/i })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('runs CI regression gate for failing and passing scenarios', () => {
    vi.useFakeTimers();
    render(React.createElement(EvaluationShowcasePage));

    fireEvent.click(screen.getByRole('button', { name: /Blocked deploy/i }));
    fireEvent.click(screen.getByRole('button', { name: /Run CI Pipeline/i }));
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByText(/Regression detected — deploy blocked/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Passing deploy/i }));
    fireEvent.click(screen.getByRole('button', { name: /Run CI Pipeline/i }));
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByText(/All gates passed — deploying to production/i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders production-derived patterns callout', () => {
    render(React.createElement(EvaluationShowcasePage));
    expect(screen.getByText(/Production-derived patterns/i)).toBeInTheDocument();
    expect(screen.getByText(/calibrated from real LLM deployment patterns at Krutrim/i)).toBeInTheDocument();
  });

  it('callout mentions eval thresholds', () => {
    render(React.createElement(EvaluationShowcasePage));
    expect(screen.getAllByText(/fidelity ≥ 0.85/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/hallucination ≤ 0.10/).length).toBeGreaterThan(0);
  });

  it('renders main page heading', () => {
    render(React.createElement(EvaluationShowcasePage));
    expect(screen.getByRole('heading', { name: /AI Evaluation Showcase/i })).toBeInTheDocument();
  });
});
