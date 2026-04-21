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

import CertificationsPage from '@/app/certifications/page';

describe('CertificationsPage', () => {
  it('renders recency-weighted and archive section labels for recruiter clarity', () => {
    render(React.createElement(CertificationsPage));

    expect(screen.getByText('AI Certifications and Validation')).toBeInTheDocument();
    expect(screen.getByText(/Featured \/ Recent AI Certifications/i)).toBeInTheDocument();
    expect(screen.getByText(/AI \/ Agentic \/ LLMOps/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Cloud \/ Platform \/ Infrastructure Foundations/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Legacy \/ Archive/i).length).toBeGreaterThan(0);
  });
});
