import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

import { LinkedInCta } from '@/components/ui/linkedin-cta';

describe('LinkedInCta', () => {
  it('renders with default label', () => {
    render(<LinkedInCta href="https://linkedin.com/in/pkavuri" />);
    const link = screen.getByRole('link', { name: /Connect on LinkedIn/i });
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/pkavuri');
  });

  it('renders with custom label and className', () => {
    render(
      <LinkedInCta
        href="https://linkedin.com/in/pkavuri"
        label="View LinkedIn"
        className="custom-class"
      />
    );
    const link = screen.getByRole('link', { name: /View LinkedIn/i });
    expect(link.className).toContain('custom-class');
  });
});
