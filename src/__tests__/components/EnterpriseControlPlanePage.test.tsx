import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

import EnterpriseControlPlanePage from '@/app/demos/enterprise-control-plane/page';

describe('EnterpriseControlPlanePage first meaningful paint', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders seeded executive snapshot above the fold before API responses return', () => {
    render(<EnterpriseControlPlanePage />);
    expect(screen.getByText(/Executive Snapshot \(Seeded Baseline\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Governance posture is preloaded/i)).toBeInTheDocument();
    expect(screen.getByText(/RBAC \+ SCIM-aligned team boundaries/i)).toBeInTheDocument();
  });

  it('shows seeded metric values immediately without waiting for API', () => {
    render(<EnterpriseControlPlanePage />);
    // SEED constants render immediately — no "Loading metric" placeholder
    expect(screen.queryByText(/Loading metric/i)).not.toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();   // totalTeams
    expect(screen.getByText('847')).toBeInTheDocument();  // activeUsers
  });
});

