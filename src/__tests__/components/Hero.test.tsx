import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// next/image does not work outside Next.js; replace with a plain <img>
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt }),
}));

// Mock AnimatedCounter to avoid animation complexity in tests
vi.mock('@/components/ui/counter', () => ({
  AnimatedCounter: ({ value, className }: { value: string; className: string }) =>
    React.createElement('span', { className }, value),
}));

// framer-motion mock (used transitively)
vi.mock('framer-motion', () => ({
  useInView: () => true,
  motion: { div: ({ children, ...props }: any) => React.createElement('div', props, children) },
}));

import { Hero } from '@/components/sections/Hero';

describe('Hero', () => {
  it('renders full name from profile.json', () => {
    render(<Hero />);
    expect(screen.getByText('Prasad Kavuri')).toBeDefined();
  });

  it('renders title and subtitle', () => {
    render(<Hero />);
    // The phrase appears in both the title paragraph and the recruiter banner
    const matches = screen.getAllByText(/Head of AI Engineering/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders all 4 pills', () => {
    render(<Hero />);
    expect(screen.getByText('Agentic AI')).toBeDefined();
    expect(screen.getByText('LLM Platforms')).toBeDefined();
    expect(screen.getByText('Applied AI Strategy')).toBeDefined();
    expect(screen.getByText('Global Engineering Leadership')).toBeDefined();
  });

  it('renders summary paragraph', () => {
    render(<Hero />);
    expect(screen.getByText(/I lead AI engineering organizations/i)).toBeDefined();
  });

  it('renders all 4 differentiator bullets', () => {
    render(<Hero />);
    expect(screen.getByText(/production AI systems — not prototypes/i)).toBeDefined();
    expect(screen.getByText(/cost, latency, and scalability/i)).toBeDefined();
    expect(screen.getByText(/align engineering, product/i)).toBeDefined();
    expect(screen.getByText(/human oversight and governance/i)).toBeDefined();
  });

  it('renders Explore AI Demos CTA linking to #tools', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /Explore AI Demos/i });
    expect(link.getAttribute('href')).toBe('#tools');
  });

  it('renders View LinkedIn CTA', () => {
    render(<Hero />);
    // Two "View LinkedIn" links exist — main CTA and recruiter strip
    const links = screen.getAllByRole('link', { name: /View LinkedIn/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].getAttribute('href')).toContain('linkedin');
  });

  it('renders Download Resume linking to resume download API', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /Download Resume/i });
    expect(link.getAttribute('href')).toContain('resume');
  });

  it('renders all 4 KPI stat labels', () => {
    render(<Hero />);
    expect(screen.getByText('Years Experience')).toBeDefined();
    expect(screen.getByText('Engineers Led')).toBeDefined();
    expect(screen.getByText('B2B Customers Enabled')).toBeDefined();
    expect(screen.getByText('Cost Reduction Delivered')).toBeDefined();
  });

  it('renders Currently Exploring section', () => {
    render(<Hero />);
    expect(screen.getByText(/Currently Exploring/i)).toBeDefined();
    expect(screen.getByText(/Small Language Models/i)).toBeDefined();
    expect(screen.getByText(/Agent-to-Agent/i)).toBeDefined();
  });

  it('renders recruiter strip with role targeting', () => {
    render(<Hero />);
    expect(screen.getByText(/Recruiters/i)).toBeDefined();
    expect(screen.getByText(/VP \/ Head of AI Engineering/i)).toBeDefined();
  });
});
