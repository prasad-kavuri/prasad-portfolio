import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/ui/counter', () => ({
  AnimatedCounter: ({ value, className }: { value: string; className?: string }) =>
    React.createElement('span', { className }, value),
}));

vi.mock('@/data/profile.json', () => ({
  default: {
    personal: {
      name: 'Prasad Kavuri',
      title: 'Head of AI Engineering',
      subtitle: 'AI Platform Architect',
      pills: ['Agentic AI', 'LLM Orchestration'],
      summary: 'AI executive with 20+ years experience.',
      linkedin: 'https://linkedin.com/in/pkavuri',
      email: 'test@example.com',
      github: 'https://github.com/prasad-kavuri',
      portfolio: 'prasadkavuri.com',
    },
    stats: [
      { value: '20+', label: 'Years Experience' },
      { value: '200+', label: 'Engineers Led' },
    ],
  },
}));

import { Hero } from '@/components/sections/Hero';

describe('Hero', () => {
  it('renders the profile name', () => {
    render(React.createElement(Hero));
    expect(screen.getByText('Prasad Kavuri')).toBeInTheDocument();
  });

  it('renders the title and subtitle', () => {
    render(React.createElement(Hero));
    // The phrase appears in both the title paragraph and the recruiter banner
    const matches = screen.getAllByText(/Head of AI Engineering/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders the summary paragraph', () => {
    render(React.createElement(Hero));
    expect(screen.getByText('AI executive with 20+ years experience.')).toBeInTheDocument();
  });

  it('renders all four differentiator lines', () => {
    render(React.createElement(Hero));
    expect(screen.getByText('I build production AI systems — not prototypes.')).toBeInTheDocument();
    expect(
      screen.getByText('I optimize for cost, latency, and scalability — not just model quality.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('I align engineering, product, and business teams around measurable outcomes.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'I design AI systems that combine capability with human oversight and governance.'
      )
    ).toBeInTheDocument();
  });

  it('renders the Explore AI Demos CTA', () => {
    render(React.createElement(Hero));
    expect(screen.getByText('Explore AI Demos')).toBeInTheDocument();
  });

  it('renders the View LinkedIn link', () => {
    render(React.createElement(Hero));
    const links = screen.getAllByText('View LinkedIn');
    expect(links.length).toBeGreaterThan(0);
  });

  it('renders stat counters', () => {
    render(React.createElement(Hero));
    expect(screen.getByText('Years Experience')).toBeInTheDocument();
    expect(screen.getByText('Engineers Led')).toBeInTheDocument();
  });
});
