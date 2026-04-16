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

import MultimodalPage from '@/app/demos/multimodal/page';

describe('MultimodalPage', () => {
  it('renders local inference privacy badges', () => {
    render(React.createElement(MultimodalPage));
    expect(screen.getByText('Multimodal AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('In-browser inference')).toBeInTheDocument();
    expect(screen.getByText('Image analysis stays local after load')).toBeInTheDocument();
  });
});
