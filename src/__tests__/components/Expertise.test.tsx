import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';

vi.mock('@/components/ui/motion', () => ({
  FadeUp: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

import { Expertise } from '@/components/sections/Expertise';

describe('Expertise', () => {
  it('renders exactly 5 visible value areas', () => {
    render(<Expertise />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('05')).toBeInTheDocument();
    expect(screen.queryByText('06')).not.toBeInTheDocument();
    expect(screen.queryByText('07')).not.toBeInTheDocument();
  });
});
