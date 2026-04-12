import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('framer-motion', () => ({
  useInView: () => true,
  useReducedMotion: () => false,
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
}));

import { FadeIn, FadeUp } from '@/components/ui/motion';

describe('motion helpers', () => {
  it('renders FadeUp children with provided className', () => {
    render(
      <FadeUp className="motion-test" duration={0.24} yOffset={12}>
        <span>Fade up child</span>
      </FadeUp>
    );

    expect(screen.getByText('Fade up child')).toBeInTheDocument();
    expect(screen.getByText('Fade up child').parentElement).toHaveClass('motion-test');
  });

  it('renders FadeIn children with provided className', () => {
    render(
      <FadeIn className="fade-in-test">
        <span>Fade in child</span>
      </FadeIn>
    );

    expect(screen.getByText('Fade in child')).toBeInTheDocument();
    expect(screen.getByText('Fade in child').parentElement).toHaveClass('fade-in-test');
  });
});
