import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// FadeUp just needs to render its children
vi.mock('@/components/ui/motion', () => ({
  FadeUp: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

import { CaseStudies } from '@/components/sections/CaseStudies';

describe('CaseStudies', () => {
  it('renders all 3 case study titles', () => {
    render(<CaseStudies />);
    expect(screen.getByText(/Building India.*Agentic AI Platform/i)).toBeDefined();
    expect(screen.getByText(/Scaling AI-Powered Mapping/i)).toBeDefined();
    expect(screen.getByText(/Delivering AI\/ML Infrastructure/i)).toBeDefined();
  });

  it('renders all 3 company badges', () => {
    render(<CaseStudies />);
    expect(screen.getByText('Krutrim')).toBeDefined();
    expect(screen.getByText('Ola')).toBeDefined();
    expect(screen.getByText('HERE Technologies')).toBeDefined();
  });

  it('renders 4 column headers for each case study', () => {
    render(<CaseStudies />);
    // CSS `uppercase` is visual-only — DOM text is capitalised, not all-caps
    const challengeHeaders = screen.getAllByText('Challenge');
    expect(challengeHeaders.length).toBe(3);
    const impactHeaders = screen.getAllByText('Impact');
    expect(impactHeaders.length).toBe(3);
    const decisionsHeaders = screen.getAllByText('Key Decisions');
    expect(decisionsHeaders.length).toBe(3);
  });

  it('renders only verified impact lines (no unverified ROI claims)', () => {
    const { container } = render(<CaseStudies />);
    expect(screen.getByText('50% latency reduction')).toBeDefined();
    expect(screen.getByText('70% infrastructure cost reduction')).toBeDefined();
    expect(screen.getByText('HD mapping supporting major OEM autonomous driving platforms')).toBeDefined();
    expect(container.textContent).not.toMatch(/ROI|recurring revenue|built from ground up/i);
  });

  it('renders key decision bullets grounded in the resume record', () => {
    render(<CaseStudies />);
    expect(screen.getByText(/intelligent model routing rather than a single model/i)).toBeDefined();
    expect(screen.getByText(/Cloud-native architectural overhaul/i)).toBeDefined();
    expect(screen.getByText(/safety-critical, regulated programs/i)).toBeDefined();
  });
});
