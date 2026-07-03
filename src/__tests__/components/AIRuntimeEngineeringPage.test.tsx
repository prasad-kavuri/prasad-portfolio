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

import AIRuntimeEngineeringPage from '@/app/ai-runtime-engineering/page';

describe('AIRuntimeEngineeringPage', () => {
  it('renders the page title and executive framing', () => {
    render(React.createElement(AIRuntimeEngineeringPage));

    expect(screen.getByText('AI Runtime Engineering')).toBeInTheDocument();
    expect(screen.getByText(/Inference Runtime Layer/i)).toBeInTheDocument();
  });

  it('renders runtime techniques with linked evidence', () => {
    render(React.createElement(AIRuntimeEngineeringPage));

    expect(screen.getByText('Speculative Decoding')).toBeInTheDocument();
    expect(screen.getByText('KV Cache Management')).toBeInTheDocument();
    expect(screen.getByText('Quantization')).toBeInTheDocument();

    const quantizationLinks = screen.getAllByRole('link', { name: /Quantization Demo/i });
    expect(quantizationLinks.some((link) => link.getAttribute('href') === '/demos/quantization')).toBe(true);
  });

  it('cites the industry signal with an accurate, caveated figure', () => {
    render(React.createElement(AIRuntimeEngineeringPage));

    expect(screen.getByText(/DSpark/i)).toBeInTheDocument();
    expect(screen.getByText(/57–85%/)).toBeInTheDocument();
  });
});
