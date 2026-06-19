import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) =>
    React.createElement('span', null, children),
}));

vi.mock('@/data/profile.json', () => ({
  default: {
    experience: [
      {
        id: 'krutrim',
        company: 'Krutrim',
        companyContext: "India's sovereign AI computing company (Ola Group)",
        title: 'Head of AI Engineering',
        period: 'March 2025 - Present',
        duration: '1 year 2 months',
        highlights: [],
        tags: ['Agentic AI', 'LLM Orchestration', 'RAG'],
      },
      {
        id: 'ola',
        company: 'Ola',
        companyContext: "India's leading mobility & maps platform",
        title: 'Senior Director of Engineering',
        period: 'September 2023 - February 2025',
        duration: '1 year 6 months',
        highlights: [],
        tags: ['B2B Platform', 'Cloud-Native'],
      },
      {
        id: 'here-head',
        company: 'HERE Technologies',
        title: 'Head of Engineering, AI/ML',
        period: '2020 - 2023',
        highlights: [],
        tags: ['AI/ML', 'Autonomous Driving'],
      },
      {
        id: 'here-director',
        company: 'HERE Technologies',
        title: 'Director of Engineering, HD Mapping',
        period: '2018 - 2020',
        highlights: [],
        tags: ['HD Mapping', 'Autonomous Systems'],
      },
      {
        id: 'here-senior-manager',
        company: 'HERE Technologies',
        title: 'Senior Manager of Engineering',
        period: '2014 - 2018',
        highlights: [],
        tags: ['Engineering Leadership'],
      },
    ],
  },
}));

import { Experience } from '@/components/sections/Experience';

describe('Experience', () => {
  it('renders the Leadership Timeline section heading', () => {
    render(<Experience />);
    expect(screen.getByText('20 Years. Four Defining Transformations.')).toBeInTheDocument();
  });

  it('renders the "Leadership Timeline" label', () => {
    render(<Experience />);
    expect(screen.getByText('Leadership Timeline')).toBeInTheDocument();
  });

  it('section has id="experience"', () => {
    render(<Experience />);
    const section = document.getElementById('experience');
    expect(section).not.toBeNull();
  });

  it('renders all 4 featured role titles', () => {
    render(<Experience />);
    expect(screen.getByText('Head of AI Engineering')).toBeInTheDocument();
    expect(screen.getByText('Senior Director of Engineering')).toBeInTheDocument();
    expect(screen.getByText('Head of Engineering, AI/ML')).toBeInTheDocument();
    expect(screen.getByText('Director of Engineering, HD Mapping')).toBeInTheDocument();
  });

  it('renders company names for featured roles', () => {
    render(<Experience />);
    expect(screen.getByText('Krutrim')).toBeInTheDocument();
    expect(screen.getByText('Ola')).toBeInTheDocument();
    // HERE Technologies appears multiple times (featured + compact strip)
    const hereMatches = screen.getAllByText('HERE Technologies');
    expect(hereMatches.length).toBeGreaterThan(0);
  });

  it('renders company context for Krutrim', () => {
    render(<Experience />);
    expect(screen.getByText("India's sovereign AI computing company (Ola Group)")).toBeInTheDocument();
  });

  it('renders the Krutrim outcome metrics', () => {
    render(<Experience />);
    expect(screen.getByText('300-seat')).toBeInTheDocument();
    expect(screen.getByText('Call center automated')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Latency reduction')).toBeInTheDocument();
    expect(screen.getByText('$10M+')).toBeInTheDocument();
    expect(screen.getByText('Revenue launched')).toBeInTheDocument();
  });

  it('renders the Ola outcome metrics', () => {
    render(<Experience />);
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure cost reduction')).toBeInTheDocument();
    expect(screen.getByText('13K+')).toBeInTheDocument();
    expect(screen.getByText('Enterprise customers')).toBeInTheDocument();
    expect(screen.getByText('35M+')).toBeInTheDocument();
    expect(screen.getByText('POIs indexed')).toBeInTheDocument();
  });

  it('renders situation and built narrative for Krutrim', () => {
    render(<Experience />);
    expect(screen.getByText(/India had no sovereign agentic AI platform/i)).toBeInTheDocument();
    expect(screen.getByText(/India's first multi-agent AI platform/i)).toBeInTheDocument();
  });

  it('renders "The Situation" and "What I Built" and "Outcomes" labels', () => {
    render(<Experience />);
    const situationLabels = screen.getAllByText('The Situation');
    expect(situationLabels.length).toBeGreaterThan(0);
    const builtLabels = screen.getAllByText('What I Built');
    expect(builtLabels.length).toBeGreaterThan(0);
    const outcomesLabels = screen.getAllByText('Outcomes');
    expect(outcomesLabels.length).toBeGreaterThan(0);
  });

  it('renders role period in mono format for featured roles', () => {
    render(<Experience />);
    expect(screen.getByText('March 2025 - Present')).toBeInTheDocument();
  });

  it('renders tags as badges for Krutrim role', () => {
    render(<Experience />);
    expect(screen.getByText('Agentic AI')).toBeInTheDocument();
    expect(screen.getByText('LLM Orchestration')).toBeInTheDocument();
  });

  it('renders "Prior Leadership at HERE Technologies" section for earlier roles', () => {
    render(<Experience />);
    expect(screen.getByText('Prior Leadership at HERE Technologies')).toBeInTheDocument();
  });

  it('renders the earlier (non-featured) roles in compact strip', () => {
    render(<Experience />);
    expect(screen.getByText('Senior Manager of Engineering')).toBeInTheDocument();
  });

  it('renders HERE Technologies in compact strip', () => {
    render(<Experience />);
    // here-senior-manager is in compact strip; HERE Technologies appears inline
    const allHere = screen.getAllByText('HERE Technologies');
    expect(allHere.length).toBeGreaterThanOrEqual(2);
  });
});
