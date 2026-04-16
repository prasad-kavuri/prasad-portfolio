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

import QuantizationPage from '@/app/demos/quantization/page';

describe('QuantizationPage', () => {
  it('renders local-first privacy/efficiency context', () => {
    render(React.createElement(QuantizationPage));
    expect(screen.getByText('Model Quantization Demo')).toBeInTheDocument();
    expect(screen.getByText('Runs on device')).toBeInTheDocument();
    expect(screen.getByText('Privacy-preserving local inference')).toBeInTheDocument();
    expect(screen.getByText('Local-First Inference Posture')).toBeInTheDocument();
    expect(screen.getByText(/processed in-browser/i)).toBeInTheDocument();
  });
});
