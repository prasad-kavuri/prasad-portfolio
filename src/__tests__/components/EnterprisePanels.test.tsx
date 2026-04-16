import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RBACPanel } from '@/components/enterprise/RBACPanel';
import { SpendAnalyticsPanel } from '@/components/enterprise/SpendAnalyticsPanel';
import { ObservabilityFeed } from '@/components/enterprise/ObservabilityFeed';
import { TokenUsageChart } from '@/components/enterprise/TokenUsageChart';
import type {
  DailyTokenUsage,
  OtelEvent,
  TeamPermissions,
  TeamSpendConfig,
  UsageMetrics,
} from '@/components/enterprise/types';

function buildDaily(days: number): DailyTokenUsage[] {
  const out: DailyTokenUsage[] = [];
  for (let i = 0; i < days; i++) {
    const day = String(i + 1).padStart(2, '0');
    out.push({
      date: `2026-04-${day}`,
      inputTokens: 1000 + i * 10,
      outputTokens: 500 + i * 8,
      cacheReadTokens: 200 + i * 5,
      totalTokens: 1700 + i * 23,
    });
  }
  return out;
}

const teams: TeamPermissions[] = [
  {
    teamId: 'engineering',
    teamName: 'Engineering',
    role: 'engineering',
    capabilities: { cowork: true, code: true, rag: true, multimodel: true, connectors: true, skills: true },
    connectorPermissions: {
      github: ['read', 'write', 'delete'],
      slack: ['read', 'write'],
    },
    memberCount: 24,
    scimProvisioned: true,
  },
  {
    teamId: 'legal',
    teamName: 'Legal',
    role: 'legal',
    capabilities: { cowork: true, code: false, rag: true, multimodel: false, connectors: false, skills: false },
    connectorPermissions: {
      drive: ['read'],
    },
    memberCount: 8,
    scimProvisioned: false,
  },
];

const spendConfigs: TeamSpendConfig[] = [
  { teamId: 'engineering', teamName: 'Engineering', monthlyBudgetUSD: 1000, spentUSD: 920, alertThresholdPct: 80 },
  { teamId: 'legal', teamName: 'Legal', monthlyBudgetUSD: 500, spentUSD: 120, alertThresholdPct: 70 },
];

const usageMetrics: UsageMetrics[] = [
  {
    teamId: 'engineering',
    teamName: 'Engineering',
    coworkSessions: 1200,
    activeUsers: 30,
    dau: 22,
    wau: 28,
    mau: 31,
    skillInvocations: 300,
    connectorInvocations: 150,
    inputTokens: 150000,
    outputTokens: 90000,
    cacheReadTokens: 40000,
    cacheWriteTokens: 10000,
    totalTokens: 290000,
    estimatedCostUSD: 23.4,
  },
  {
    teamId: 'legal',
    teamName: 'Legal',
    coworkSessions: 180,
    activeUsers: 8,
    dau: 5,
    wau: 7,
    mau: 8,
    skillInvocations: 40,
    connectorInvocations: 12,
    inputTokens: 30000,
    outputTokens: 12000,
    cacheReadTokens: 8000,
    cacheWriteTokens: 2000,
    totalTokens: 50000,
    estimatedCostUSD: 2.1,
  },
];

const events: OtelEvent[] = [
  {
    eventId: 'evt-1',
    timestamp: new Date(Date.now() - 30_000).toISOString(),
    teamId: 'engineering',
    teamName: 'Engineering',
    userId: 'eng-user-1',
    eventType: 'tool_call',
    resource: 'github',
    action: 'create_issue',
    approvalMode: 'auto',
    durationMs: 240,
    tokenCost: { inputTokens: 1200, outputTokens: 600, totalTokens: 1800 },
    metadata: { repo: 'prasad-portfolio' },
  },
  {
    eventId: 'evt-2',
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    teamId: 'legal',
    teamName: 'Legal',
    userId: 'legal-user-1',
    eventType: 'action_rejected',
    resource: 'drive',
    action: 'delete_file',
    approvalMode: 'manual',
    durationMs: 120,
    metadata: { reason: 'policy' },
  },
  {
    eventId: 'evt-3',
    timestamp: new Date(Date.now() - 90_000).toISOString(),
    teamId: 'engineering',
    teamName: 'Engineering',
    userId: 'eng-user-2',
    eventType: 'token_limit_warning',
    resource: 'router',
    action: 'limit_alert',
    approvalMode: 'auto',
    durationMs: 80,
    tokenCost: { inputTokens: 2000, outputTokens: 1800, totalTokens: 3800 },
    metadata: { limit: 5000 },
  },
];

describe('Enterprise components', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('RBACPanel renders team details and capability toggle toast', () => {
    render(<RBACPanel teams={teams} />);
    expect(screen.getByRole('heading', { name: 'Engineering' })).toBeInTheDocument();
    expect(screen.getAllByText('SCIM').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('Legal'));
    expect(screen.getAllByText('Legal').length).toBeGreaterThan(0);

    const toggle = screen.getByRole('switch', { name: /Toggle Cowork for Legal/i });
    fireEvent.click(toggle);
    expect(screen.getByText('Change saved (simulated)')).toBeInTheDocument();

    vi.advanceTimersByTime(2600);
  });

  it('SpendAnalyticsPanel renders utilization and supports adjust modal flow', () => {
    render(<SpendAnalyticsPanel spendConfigs={spendConfigs} usageMetrics={usageMetrics} />);

    expect(screen.getByText('Teams >80%')).toBeInTheDocument();
    expect(screen.getByText('Token Cost Breakdown by Team')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Adjust' })[0]);
    expect(screen.getByText(/Adjust Budget — Engineering/i)).toBeInTheDocument();

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '1500' } });
    fireEvent.click(screen.getByRole('button', { name: /Save \(simulated\)/i }));
    expect(screen.queryByText(/Adjust Budget — Engineering/i)).not.toBeInTheDocument();
  });

  it('ObservabilityFeed supports filtering, expansion, export, and auto-refresh toggle', () => {
    render(<ObservabilityFeed events={events} />);

    expect(screen.getByText('Event Feed', { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/3 events/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'legal' } });
    expect(screen.getByText(/1 events/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /tool call/i }));
    fireEvent.click(screen.getByRole('button', { name: /action rejected/i }));
    expect(screen.getByText(/No events match the current filters/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /action rejected/i }));
    fireEvent.click(screen.getByRole('button', { name: /tool call/i }));

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'all' } });
    fireEvent.click(screen.getByText(/eng-user-1/i));
    expect(screen.getByText(/prasad-portfolio/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Export to SIEM/i }));
    expect(screen.getByText(/Sample NDJSON Payload/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    const liveToggle = screen.getByRole('switch', { name: /toggle auto-refresh/i });
    fireEvent.click(liveToggle);
    expect(screen.getByText(/● Live/i)).toBeInTheDocument();
    vi.advanceTimersByTime(4100);
    fireEvent.click(liveToggle);
  });

  it('TokenUsageChart renders controls and toggles time range and breakdown mode', () => {
    const data = buildDaily(30);
    render(<TokenUsageChart dailyData={data} allTeamsData={data} teamOptions={['all', 'engineering']} />);

    expect(screen.getByText(/Token Usage Over Time/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '7d' }));
    fireEvent.click(screen.getByRole('button', { name: 'By Cost' }));
    expect(screen.getByText(/Est\. Cost \(7d\)/i)).toBeInTheDocument();

    const svg = document.querySelector('svg[viewBox="0 0 760 220"]') as SVGElement;
    expect(svg).toBeTruthy();
    Object.defineProperty(svg, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 760, height: 220, right: 760, bottom: 220, x: 0, y: 0, toJSON: () => ({}) }),
    });
    fireEvent.mouseMove(svg, { clientX: 220, clientY: 80 });
  });
});
