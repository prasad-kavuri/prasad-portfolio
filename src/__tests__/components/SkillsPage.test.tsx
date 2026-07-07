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

import SkillsPage from '@/app/skills/page';

describe('SkillsPage', () => {
  it('renders the catalog title', () => {
    render(React.createElement(SkillsPage));
    expect(screen.getByText('AI Skills Catalog')).toBeInTheDocument();
  });

  it('disambiguates application-level skills from repo-level Agent Skills files', () => {
    render(React.createElement(SkillsPage));
    expect(screen.getByText(/application-level skills/i)).toBeInTheDocument();
    expect(screen.getByText('skills/*/SKILL.md')).toBeInTheDocument();
  });

  it('cites the open Agent Skills format', () => {
    render(React.createElement(SkillsPage));
    const link = screen.getByRole('link', { name: /Agent Skills format/i });
    expect(link).toHaveAttribute('href', 'https://github.com/agentskills/agentskills');
  });
});
