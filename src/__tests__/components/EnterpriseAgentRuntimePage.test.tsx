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

import EnterpriseAgentRuntimePage from '@/app/enterprise-agent-runtime/page';

describe('EnterpriseAgentRuntimePage', () => {
  it('renders the page title and executive framing', () => {
    render(React.createElement(EnterpriseAgentRuntimePage));

    expect(screen.getByRole('heading', { name: 'Enterprise Agent Runtime', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Agent Platform Layer/i)).toBeInTheDocument();
  });

  it('renders runtime concerns linked to existing live evidence', () => {
    render(React.createElement(EnterpriseAgentRuntimePage));

    expect(screen.getByText('Prompt Versioning & Registry')).toBeInTheDocument();
    expect(screen.getByText('Canary Deployment & Rollback')).toBeInTheDocument();
    expect(screen.getByText('Human Approval (HITL)')).toBeInTheDocument();
    expect(screen.getByText('Capability Registry')).toBeInTheDocument();

    const lifecycleLinks = screen.getAllByRole('link', { name: /Agent Lifecycle Tab/i });
    expect(lifecycleLinks.some((link) => link.getAttribute('href') === '/demos/enterprise-control-plane')).toBe(true);

    const skillsLinks = screen.getAllByRole('link', { name: /Skills Catalog/i });
    expect(skillsLinks.some((link) => link.getAttribute('href') === '/skills')).toBe(true);

    const hitlLinks = screen.getAllByRole('link', { name: /Multi-Agent HITL Demo/i });
    expect(hitlLinks.some((link) => link.getAttribute('href') === '/demos/multi-agent')).toBe(true);
  });

  it('frames why runtime matters more than the prompt', () => {
    render(React.createElement(EnterpriseAgentRuntimePage));

    expect(screen.getByText(/Why this, not just prompts/i)).toBeInTheDocument();
  });
});
