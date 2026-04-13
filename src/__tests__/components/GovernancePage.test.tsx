import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

import GovernancePage from '@/app/governance/page';
import { GOVERNANCE_SNAPSHOT } from '@/data/telemetry-snapshots';

describe('GovernancePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows mixed telemetry disclosure and precise snapshot timestamp', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    render(React.createElement(GovernancePage));

    expect(screen.getByText('Mixed telemetry')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Snapshot generated at: ${GOVERNANCE_SNAPSHOT.generatedAtIso}`))).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Rate Limit Remaining')).toBeInTheDocument();
    });
  });

  it('renders policy and audit data from centralized governance snapshot', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    render(React.createElement(GovernancePage));

    const firstControl = GOVERNANCE_SNAPSHOT.policyControls[0];
    const firstAudit = GOVERNANCE_SNAPSHOT.auditLog[0];

    await waitFor(() => {
      expect(screen.getByText(firstControl.label)).toBeInTheDocument();
      expect(screen.getAllByText(firstAudit.event).length).toBeGreaterThan(0);
    });
  });

  it('renders trust control flow from centralized governance snapshot', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    render(React.createElement(GovernancePage));

    expect(screen.getByText('Trust Control Flow')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(GOVERNANCE_SNAPSHOT.trustFlow[0])).toBeInTheDocument();
      expect(screen.getByText(GOVERNANCE_SNAPSHOT.trustFlow[1])).toBeInTheDocument();
    });
  });

  it('overlays live eval snapshot values when api data is available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalQueriesLogged: 55,
        liveEval: { casesRun: 10, passed: 9, avgScore: 0.97 },
        drift: { assistantSamples: 2, multiAgentSamples: 1 },
      }),
    }));
    render(React.createElement(GovernancePage));

    await waitFor(() => {
      expect(screen.getByText('0.97')).toBeInTheDocument();
      expect(screen.getByText('0.010')).toBeInTheDocument();
      expect(screen.getByText('55')).toBeInTheDocument();
    });
  });
});
