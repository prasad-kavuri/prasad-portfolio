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

import CapabilitiesPage from '@/app/capabilities/page';

describe('CapabilitiesPage', () => {
  it('renders capability map title and executive context', () => {
    render(React.createElement(CapabilitiesPage));

    expect(screen.getByText('AI Platform Capabilities')).toBeInTheDocument();
    expect(screen.getByText(/Executive Capability Graph/i)).toBeInTheDocument();
  });

  it('renders representative capability areas and evidence links', () => {
    render(React.createElement(CapabilitiesPage));

    expect(screen.getByText('Agentic AI Systems')).toBeInTheDocument();
    expect(screen.getByText('Tool / MCP Orchestration')).toBeInTheDocument();
    expect(screen.getByText('AI Governance and Human-in-the-Loop')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Multi-Agent Demo/i })).toHaveAttribute('href', '/demos/multi-agent');
    const governanceLinks = screen.getAllByRole('link', { name: /^Governance$/i });
    expect(governanceLinks.some((link) => link.getAttribute('href') === '/governance')).toBe(true);
    const certificationsLinks = screen.getAllByRole('link', { name: /^Certifications$/i });
    expect(certificationsLinks.some((link) => link.getAttribute('href') === '/certifications')).toBe(true);
  });
});
