import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

import ForRecruitersPage from '@/app/for-recruiters/page';
import { EXECUTIVE_METRICS } from '@/lib/executive-metrics';

describe('ForRecruitersPage', () => {
  it('renders all 5 canonical executive metric stat cards', () => {
    render(React.createElement(ForRecruitersPage));

    // Labels
    expect(screen.getByText('Years Experience')).toBeInTheDocument();
    expect(screen.getByText('Engineers Led')).toBeInTheDocument();
    expect(screen.getByText('B2B Customers Enabled')).toBeInTheDocument();
    expect(screen.getByText('Cost Reduction Delivered')).toBeInTheDocument();
    expect(screen.getByText('Revenue Launched')).toBeInTheDocument();
  });

  it('renders canonical metric values from EXECUTIVE_METRICS', () => {
    render(React.createElement(ForRecruitersPage));

    expect(screen.getAllByText(EXECUTIVE_METRICS.yearsExperience).length).toBeGreaterThan(0);
    expect(screen.getAllByText(EXECUTIVE_METRICS.engineersLed).length).toBeGreaterThan(0);
    expect(screen.getAllByText(EXECUTIVE_METRICS.b2bCustomersEnabled).length).toBeGreaterThan(0);
    expect(screen.getAllByText(EXECUTIVE_METRICS.costReductionDisplay).length).toBeGreaterThan(0);
    expect(screen.getAllByText(EXECUTIVE_METRICS.revenueLaunched).length).toBeGreaterThan(0);
  });

  it('does not surface isolated "100M+" claim', () => {
    render(React.createElement(ForRecruitersPage));
    expect(screen.queryByText(/100M\+/)).not.toBeInTheDocument();
  });

  it('renders recruiter header and CTAs', () => {
    render(React.createElement(ForRecruitersPage));
    expect(screen.getByText(/Everything you need to evaluate Prasad/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /LinkedIn/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Book 30-min Call/i })).toBeInTheDocument();
  });

  it('renders guided evaluation path steps', () => {
    render(React.createElement(ForRecruitersPage));
    expect(screen.getByText(/Recommended Path/i)).toBeInTheDocument();
    expect(screen.getByText(/Start with capability map/i)).toBeInTheDocument();
    expect(screen.getByText(/See the flagship demo/i)).toBeInTheDocument();
    expect(screen.getByText(/Review governance controls/i)).toBeInTheDocument();
    expect(screen.getByText(/Book a conversation/i)).toBeInTheDocument();
  });

  it('renders visible email address as text in CTA row', () => {
    render(React.createElement(ForRecruitersPage));
    const emailLink = screen.getByRole('link', { name: 'vbkpkavuri@gmail.com' });
    expect(emailLink.getAttribute('href')).toBe('mailto:vbkpkavuri@gmail.com');
  });

  it('renders "Who this portfolio is built for" qualifier section', () => {
    render(React.createElement(ForRecruitersPage));
    expect(screen.getByText(/Who This Portfolio Is Built For/i)).toBeInTheDocument();
    expect(screen.getByText(/platform thinking, not just model tuning/i)).toBeInTheDocument();
    expect(screen.getByText(/Chicago-area or remote-first/i)).toBeInTheDocument();
  });

  it('CTA row has 4 elements: Download Resume, LinkedIn, email, Book Call', () => {
    render(React.createElement(ForRecruitersPage));
    expect(screen.getByRole('link', { name: /Download Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /LinkedIn/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'vbkpkavuri@gmail.com' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Book 30-min Call/i })).toBeInTheDocument();
  });
});
