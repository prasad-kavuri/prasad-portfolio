import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('@/components/ui/motion', () => ({
  FadeUp: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  ChevronDown:  ({ ...props }: object) => React.createElement('span', { 'data-icon': 'chevron-down',  ...props }),
  ChevronRight: ({ ...props }: object) => React.createElement('span', { 'data-icon': 'chevron-right', ...props }),
}));

import { AIArchitecture } from '@/components/sections/AIArchitecture';
import { trackEvent } from '@/lib/analytics';

describe('AIArchitecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the section heading', () => {
    render(<AIArchitecture />);
    expect(screen.getByText('How a Request Moves Through the Platform')).toBeInTheDocument();
  });

  it('renders "Platform Execution Flow" label', () => {
    render(<AIArchitecture />);
    expect(screen.getByText('Platform Execution Flow')).toBeInTheDocument();
  });

  it('renders all 14 layer names', () => {
    render(<AIArchitecture />);
    expect(screen.getByText('User Intent')).toBeInTheDocument();
    expect(screen.getByText('Agent Orchestration')).toBeInTheDocument();
    expect(screen.getByText('Memory & Context')).toBeInTheDocument();
    expect(screen.getByText('Tool / MCP Layer')).toBeInTheDocument();
    expect(screen.getByText('Model Router')).toBeInTheDocument();
    expect(screen.getByText('Inference')).toBeInTheDocument();
    expect(screen.getByText('Evaluation')).toBeInTheDocument();
    expect(screen.getByText('Guardrails')).toBeInTheDocument();
    expect(screen.getByText('Observability')).toBeInTheDocument();
    expect(screen.getByText('Drift Monitor')).toBeInTheDocument();
    expect(screen.getByText('FinOps')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Human Approval')).toBeInTheDocument();
    expect(screen.getByText('Business Outcome')).toBeInTheDocument();
  });

  it('renders layer numbers 01 through 14', () => {
    render(<AIArchitecture />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('all layer buttons have aria-expanded=false initially', () => {
    render(<AIArchitecture />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('all layer buttons have a descriptive aria-label', () => {
    render(<AIArchitecture />);
    // Layer 01: "User Intent: Natural language · API call · UI action"
    const btn = screen.getByRole('button', { name: /User Intent/i });
    expect(btn).toBeInTheDocument();
    expect(btn.getAttribute('aria-label')).toContain('User Intent');
  });

  it('clicking a layer expands its detail panel', () => {
    render(<AIArchitecture />);
    const btn = screen.getByRole('button', { name: /User Intent/i });
    fireEvent.click(btn);
    expect(screen.getByText(/Every request enters as unstructured intent/i)).toBeInTheDocument();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking an expanded layer collapses it', () => {
    render(<AIArchitecture />);
    const btn = screen.getByRole('button', { name: /User Intent/i });
    fireEvent.click(btn);
    expect(screen.getByText(/Every request enters as unstructured intent/i)).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByText(/Every request enters as unstructured intent/i)).not.toBeInTheDocument();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('clicking a different layer closes the previous one', () => {
    render(<AIArchitecture />);
    const btn1 = screen.getByRole('button', { name: /User Intent/i });
    const btn2 = screen.getByRole('button', { name: /Agent Orchestration/i });

    fireEvent.click(btn1);
    expect(screen.getByText(/Every request enters as unstructured intent/i)).toBeInTheDocument();

    fireEvent.click(btn2);
    expect(screen.queryByText(/Every request enters as unstructured intent/i)).not.toBeInTheDocument();
    expect(screen.getByText(/A planner agent decomposes complex tasks/i)).toBeInTheDocument();
  });

  it('fires trackEvent with layer id when a layer is expanded', () => {
    render(<AIArchitecture />);
    const btn = screen.getByRole('button', { name: /User Intent/i });
    fireEvent.click(btn);
    expect(trackEvent).toHaveBeenCalledWith('ai_architecture_layer_clicked', { layer: 'user-intent' });
  });

  it('does NOT fire trackEvent when collapsing a layer', () => {
    render(<AIArchitecture />);
    const btn = screen.getByRole('button', { name: /User Intent/i });
    fireEvent.click(btn); // expand → fires
    vi.clearAllMocks();
    fireEvent.click(btn); // collapse → should NOT fire
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('renders the category legend with all 8 categories', () => {
    render(<AIArchitecture />);
    expect(screen.getAllByText('Entry')).not.toHaveLength(0);
    expect(screen.getAllByText('Agentic')).not.toHaveLength(0);
    expect(screen.getAllByText('Data')).not.toHaveLength(0);
    expect(screen.getAllByText('Model')).not.toHaveLength(0);
    expect(screen.getAllByText('Quality')).not.toHaveLength(0);
    expect(screen.getAllByText('Ops')).not.toHaveLength(0);
    expect(screen.getAllByText('Governance')).not.toHaveLength(0);
    expect(screen.getAllByText('Outcome')).not.toHaveLength(0);
  });

  it('renders expanded detail with tech chips', () => {
    render(<AIArchitecture />);
    const btn = screen.getByRole('button', { name: /User Intent/i });
    fireEvent.click(btn);
    expect(screen.getByText('Rate limiting')).toBeInTheDocument();
    expect(screen.getByText('Input validation')).toBeInTheDocument();
  });

  it('renders expanded detail with portfolio example callout', () => {
    render(<AIArchitecture />);
    const btn = screen.getByRole('button', { name: /User Intent/i });
    fireEvent.click(btn);
    expect(screen.getByText('Portfolio Example')).toBeInTheDocument();
    expect(screen.getByText(/Portfolio Assistant/i)).toBeInTheDocument();
  });

  it('renders bottom callout with Explore Demos link', () => {
    render(<AIArchitecture />);
    expect(screen.getByText('All 14 layers are live in this portfolio')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Explore Demos/i });
    expect(link.getAttribute('href')).toBe('/demos');
  });

  it('section has id="ai-architecture"', () => {
    render(<AIArchitecture />);
    const section = document.getElementById('ai-architecture');
    expect(section).not.toBeNull();
  });
});
