import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

import StatusPage from '@/app/status/page';
import { STATUS_SNAPSHOT } from '@/data/telemetry-snapshots';

describe('StatusPage', () => {
  it('shows telemetry disclosure copy', () => {
    render(React.createElement(StatusPage));

    expect(screen.getByText('Mixed telemetry')).toBeInTheDocument();
    expect(screen.getByText(/snapshot and illustrative metrics/i)).toBeInTheDocument();
    // Timestamp is now dynamic via SnapshotTimestamp — verify it renders something
    expect(screen.getByText(/Snapshot refreshed at/i)).toBeInTheDocument();
  });

  it('does not use live status phrasing in service badges', () => {
    render(React.createElement(StatusPage));

    expect(screen.queryByText(/Live ·/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Operational ·/i).length).toBeGreaterThan(0);
  });

  it('renders services from centralized status snapshot data', () => {
    render(React.createElement(StatusPage));

    const [firstServiceName, firstServiceStatus] = STATUS_SNAPSHOT.services[0];
    expect(screen.getByText(firstServiceName)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(firstServiceStatus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
  });

  it('renders all systems from centralized status snapshot data (13 total)', () => {
    render(React.createElement(StatusPage));

    expect(STATUS_SNAPSHOT.services).toHaveLength(13);
    expect(screen.getByText('AI Evaluation Showcase')).toBeInTheDocument();
    expect(screen.getByText('Native Browser AI Skill')).toBeInTheDocument();
    expect(screen.getByText('AI Spatial Intelligence & World Generation')).toBeInTheDocument();
  });

  it('renders trust controls from centralized snapshot data', () => {
    render(React.createElement(StatusPage));

    expect(screen.getByText('Trust Controls')).toBeInTheDocument();
    const [firstLabel, firstDetail] = STATUS_SNAPSHOT.trustControls[0];
    expect(screen.getByText(firstLabel)).toBeInTheDocument();
    expect(screen.getByText(firstDetail)).toBeInTheDocument();
  });
});
