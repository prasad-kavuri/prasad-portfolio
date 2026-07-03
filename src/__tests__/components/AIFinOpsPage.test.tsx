import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

import AIFinOpsPage from '@/app/ai-finops/page';

describe('AIFinOpsPage', () => {
  it('renders the page title and executive framing', () => {
    render(React.createElement(AIFinOpsPage));

    expect(screen.getByRole('heading', { name: 'AI FinOps', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Executive Cost Discipline/i)).toBeInTheDocument();
  });

  it('renders FinOps levers linked to existing live evidence', () => {
    render(React.createElement(AIFinOpsPage));

    expect(screen.getByText('Cost per Request')).toBeInTheDocument();
    expect(screen.getByText('Routing Savings')).toBeInTheDocument();
    expect(screen.getByText('Speculative Decode Savings')).toBeInTheDocument();

    const routerLinks = screen.getAllByRole('link', { name: /LLM Router Demo/i });
    expect(routerLinks.some((link) => link.getAttribute('href') === '/demos/llm-router')).toBe(true);

    const runtimeLinks = screen.getAllByRole('link', { name: /AI Runtime Engineering/i });
    expect(runtimeLinks.some((link) => link.getAttribute('href') === '/ai-runtime-engineering')).toBe(true);
  });

  it('states the pricing basis is illustrative, not a live billing feed', () => {
    render(React.createElement(AIFinOpsPage));

    expect(screen.getByText(/not a live billing feed/i)).toBeInTheDocument();
  });
});
