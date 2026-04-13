import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

import StatusPage from '@/app/status/page';

describe('StatusPage', () => {
  it('shows telemetry disclosure copy', () => {
    render(React.createElement(StatusPage));

    expect(screen.getByText('Mixed telemetry')).toBeInTheDocument();
    expect(screen.getByText(/snapshot and illustrative metrics/i)).toBeInTheDocument();
  });

  it('does not use live status phrasing in service badges', () => {
    render(React.createElement(StatusPage));

    expect(screen.queryByText(/Live ·/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Operational ·/i).length).toBeGreaterThan(0);
  });
});
