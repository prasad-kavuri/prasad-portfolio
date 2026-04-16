import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  it('renders finops routing context for executive evaluation', () => {
    render(React.createElement(LLMRouterDemo));
    expect(screen.getByText('LLM Router Demo')).toBeInTheDocument();
    expect(screen.getByText('FinOps Routing Signal')).toBeInTheDocument();
    expect(screen.getByText(/illustrative estimates/i)).toBeInTheDocument();
  });
});
