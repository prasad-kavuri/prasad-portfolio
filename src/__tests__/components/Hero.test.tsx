import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

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
import { trackEvent } from '@/lib/analytics';

describe('Hero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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
    expect(screen.getByText(/I've spent the last 20 years building and scaling technology platforms/i)).toBeDefined();
  });

  it('renders all 4 differentiator bullets', () => {
    render(<Hero />);
    expect(screen.getByText(/production AI systems — not prototypes/i)).toBeDefined();
    expect(screen.getByText(/cost, latency, and scalability/i)).toBeDefined();
    expect(screen.getByText(/align engineering, product/i)).toBeDefined();
    expect(screen.getByText(/human oversight and governance/i)).toBeDefined();
  });

  it('surfaces signature-system quality callout and evaluation showcase link', () => {
    render(<Hero />);
    expect(screen.getByText(/Signature System: AI Evaluation Showcase/i)).toBeDefined();
    expect(screen.getByText(/Why this matters: quality regressions are surfaced before release/i)).toBeDefined();
    const link = screen.getByRole('link', { name: /Explore Signature System/i });
    expect(link.getAttribute('href')).toBe('/demos/evaluation-showcase');
  });

  it('renders Explore All Demos CTA linking to #tools', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /Explore All Demos/i });
    expect(link.getAttribute('href')).toBe('#tools');
  });

  it('renders View Signature Demo CTA linking to multi-agent demo', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /View Signature Demo/i });
    expect(link.getAttribute('href')).toBe('/demos/multi-agent');
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
    expect(screen.getAllByText(/VP \/ Head of AI Engineering/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Signature artifact for interview review/i)).toBeDefined();
  });

  it('renders trust and governance summary with responsible disclosure link', () => {
    render(<Hero />);
    expect(screen.getByText(/Trust & Governance at a Glance/i)).toBeDefined();
    expect(screen.getByText(/Centralized prompt injection and output safety checks/i)).toBeDefined();
    expect(screen.getByText(/Human approval required/i)).toBeDefined();
    expect(screen.getByText(/Decision traces are logged via trace IDs/i)).toBeDefined();
    expect(screen.getByText(/offline eval suites with online drift monitoring/i)).toBeDefined();
    expect(screen.getByText(/Upstash-backed rate limiting/i)).toBeDefined();
    const disclosureLink = screen.getByRole('link', { name: /Responsible disclosure policy/i });
    expect(disclosureLink.getAttribute('href')).toBe('/.well-known/security.txt');
  });

  it('fires trackEvent(linkedin_clicked) when View LinkedIn is clicked', () => {
    render(<Hero />);
    const links = screen.getAllByRole('link', { name: /View LinkedIn/i });
    // Remove href to prevent happy-dom from navigating; React onClick still fires
    links[0].removeAttribute('href');
    fireEvent.click(links[0]);
    expect(trackEvent).toHaveBeenCalledWith('linkedin_clicked');
  });

  it('fires trackEvent(resume_downloaded) when Download Resume is clicked', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /Download Resume/i });
    // Remove href to prevent happy-dom from navigating; React onClick still fires
    link.removeAttribute('href');
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith('resume_downloaded');
  });
});
