import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgentContext } from '@/components/AgentContext';
import profile from '@/data/profile.json';

describe('AgentContext', () => {
  it('attributes career metrics to Ola, consistently with the canonical profile', () => {
    const ola = profile.experience.find((entry) => entry.id === 'ola');
    expect(ola?.company).toBe('Ola');
    expect(ola?.highlights.some((highlight) => highlight.includes('70% reduction in infrastructure costs'))).toBe(true);
    expect(ola?.highlights.some((highlight) => highlight.includes('13,000+ enterprise customers'))).toBe(true);

    render(<AgentContext />);
    const text = screen.getByLabelText('Professional summary').textContent;
    expect(text).toContain(`At ${ola?.company}, he delivered a 70% infrastructure cost reduction across a platform serving 13,000+ enterprise customers.`);
    expect(text).not.toContain('at Krutrim serving');
    expect(text).toContain('a FinOps router. At Ola');
    expect(text).not.toContain('router that achieved');
  });

  it('preserves the accessible, visually hidden crawler-summary container', () => {
    render(<AgentContext />);
    const summary = screen.getByLabelText('Professional summary');
    expect(summary).toHaveClass('sr-only');
    expect(summary).toHaveAttribute('data-type', 'agent-context');
    expect(summary).toHaveTextContent('Head of AI Platform & Agentic Solutions at Zip');
  });
});
