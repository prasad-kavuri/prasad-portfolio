import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

import { LinkedInCTA } from '@/components/ui/LinkedInCTA';

describe('LinkedInCTA', () => {
  it('renders executive CTA copy and connect button', () => {
    render(<LinkedInCTA href="https://linkedin.com/in/pkavuri" />);

    expect(screen.getByText('Open to Executive AI Engineering Conversations')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Connect with Prasad/i });
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/pkavuri');
  });
});
