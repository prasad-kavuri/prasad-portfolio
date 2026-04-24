import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import AgentPage from '@/app/agent/page';

describe('/agent page', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement(AgentPage));
    expect(container).toBeTruthy();
  });

  it('contains "Head of AI Engineering"', () => {
    render(React.createElement(AgentPage));
    const matches = screen.getAllByText(/Head of AI Engineering/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('contains all 8 core capabilities', () => {
    render(React.createElement(AgentPage));
    const capabilities = [
      'Agentic AI Orchestration',
      'LLM Routing & Cost Optimization',
      'AI Governance & HITL Systems',
      'RAG Pipelines & Vector Search',
      'Multi-Agent Systems',
      'Drift Monitoring & Eval Gating',
      'AI FinOps',
      'Enterprise Platform Engineering',
    ];
    for (const cap of capabilities) {
      expect(screen.getByText(cap)).toBeInTheDocument();
    }
  });

  it('contains link to /ai-profile.json', () => {
    render(React.createElement(AgentPage));
    const link = screen.getByRole('link', { name: /ai-profile\.json/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/ai-profile.json');
  });

  it('contains link to /demos/evaluation-showcase', () => {
    render(React.createElement(AgentPage));
    const link = screen.getByRole('link', { name: /evaluation-showcase/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/demos/evaluation-showcase');
  });
});
