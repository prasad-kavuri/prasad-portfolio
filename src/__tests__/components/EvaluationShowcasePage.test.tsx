import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

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
