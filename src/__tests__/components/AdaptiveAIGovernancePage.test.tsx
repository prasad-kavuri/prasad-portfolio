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

import AdaptiveAIGovernancePage from '@/app/adaptive-ai-governance/page';

describe('AdaptiveAIGovernancePage', () => {
  it('renders the page title and runtime framing', () => {
    render(React.createElement(AdaptiveAIGovernancePage));

    expect(screen.getByRole('heading', { name: 'Adaptive AI Governance', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Runtime Governance Layer/i)).toBeInTheDocument();
    expect(screen.getByText(/moving from static review to runtime control/i)).toBeInTheDocument();
  });

  it('renders governance controls linked to the live risk-routing evidence', () => {
    render(React.createElement(AdaptiveAIGovernancePage));

    expect(screen.getByText('Runtime Risk Classification')).toBeInTheDocument();
    expect(screen.getByText('Risk-Aware Model Routing')).toBeInTheDocument();
    expect(screen.getByText('Human Approval Escalation')).toBeInTheDocument();

    const routerLinks = screen.getAllByRole('link', { name: /Live Runtime Governance Panel/i });
    expect(routerLinks.some((link) => link.getAttribute('href') === '/demos/llm-router')).toBe(true);
  });
});
