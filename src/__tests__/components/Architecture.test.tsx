import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt, ...props }),
}));

vi.mock('framer-motion', () => ({
  useInView: () => true,
  useReducedMotion: () => false,
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    svg: ({ children, ...props }: any) => React.createElement('svg', props, children),
    path: (props: any) => React.createElement('path', props),
  },
}));

import { Architecture } from '@/components/sections/Architecture';

describe('Architecture', () => {
  it('renders the system architecture section and diagram image', () => {
    render(<Architecture />);

    expect(screen.getByText('How I Build Enterprise AI Systems')).toBeInTheDocument();
    expect(screen.getByText('Agentic Orchestration Layer')).toBeInTheDocument();
    expect(screen.getByText(/System-level view of the portfolio/i)).toBeInTheDocument();

    const diagram = screen.getByRole('img', {
      name: /System architecture diagram for the portfolio AI platform/i,
    });
    expect(diagram).toHaveAttribute('src', '/architecture-diagram.svg');
  });

  it('highlights a layer on hover', () => {
    render(<Architecture />);

    const layerCard = screen.getByText('Agentic Orchestration Layer').closest('.cursor-pointer');
    expect(layerCard).not.toBeNull();

    fireEvent.mouseEnter(layerCard!);
    expect(layerCard?.className).toContain('scale-[1.01]');

    fireEvent.mouseLeave(layerCard!);
    expect(layerCard?.className).not.toContain('scale-[1.01]');
  });
});
