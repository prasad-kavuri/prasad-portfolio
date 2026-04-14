import { describe, it, expect } from 'vitest';
import {
  getTeamPermissions,
  getTeamSpendConfigs,
  getUsageMetrics,
  getDailyTokenUsage,
  getRecentOtelEvents,
  getOrgSummary,
} from '@/lib/enterpriseMockData';

const PRICING = { input: 3, output: 15, cacheRead: 0.30, cacheWrite: 3.75 };

describe('enterpriseMockData', () => {
  it('getTeamPermissions returns 5 teams with required fields', () => {
    const teams = getTeamPermissions();
    expect(teams).toHaveLength(5);
    for (const team of teams) {
      expect(team).toHaveProperty('teamId');
      expect(team).toHaveProperty('teamName');
      expect(team).toHaveProperty('role');
      expect(team).toHaveProperty('capabilities');
      expect(team).toHaveProperty('connectorPermissions');
      expect(team).toHaveProperty('memberCount');
      expect(team).toHaveProperty('scimProvisioned');
    }
  });

  it('all team capabilities are boolean', () => {
    const teams = getTeamPermissions();
    for (const team of teams) {
      for (const val of Object.values(team.capabilities)) {
        expect(typeof val).toBe('boolean');
      }
    }
  });

  it('Legal team has no write or delete connector permissions', () => {
    const teams = getTeamPermissions();
    const legal = teams.find(t => t.teamId === 'legal');
    expect(legal).toBeDefined();
    for (const actions of Object.values(legal!.connectorPermissions)) {
      expect(actions).not.toContain('write');
      expect(actions).not.toContain('delete');
    }
  });

  it('getTeamSpendConfigs spentUSD is always <= monthlyBudgetUSD', () => {
    const configs = getTeamSpendConfigs();
    for (const cfg of configs) {
      expect(cfg.spentUSD).toBeLessThanOrEqual(cfg.monthlyBudgetUSD);
    }
  });

  it('getUsageMetrics totalTokens equals sum of input+output+cache', () => {
    const metrics = getUsageMetrics();
    for (const m of metrics) {
      expect(m.totalTokens).toBe(m.inputTokens + m.outputTokens + m.cacheReadTokens);
    }
  });

  it('estimatedCostUSD matches token pricing formula', () => {
    const metrics = getUsageMetrics();
    for (const m of metrics) {
      const expected =
        (m.inputTokens     * PRICING.input     +
         m.outputTokens    * PRICING.output    +
         m.cacheReadTokens * PRICING.cacheRead +
         m.cacheWriteTokens * PRICING.cacheWrite) / 1_000_000;
      expect(m.estimatedCostUSD).toBeCloseTo(expected, 5);
    }
  });

  it('getDailyTokenUsage returns correct number of days', () => {
    expect(getDailyTokenUsage(undefined, 7)).toHaveLength(7);
    expect(getDailyTokenUsage(undefined, 14)).toHaveLength(14);
    expect(getDailyTokenUsage(undefined, 30)).toHaveLength(30);
  });

  it('daily token usage weekends are lower than weekdays on average', () => {
    const days = getDailyTokenUsage(undefined, 30);
    const weekdayAvg = days
      .filter(d => { const dow = new Date(d.date).getDay(); return dow >= 1 && dow <= 5; })
      .reduce((s, d) => s + d.totalTokens, 0) / days.filter(d => { const dow = new Date(d.date).getDay(); return dow >= 1 && dow <= 5; }).length;
    const weekendDays = days.filter(d => { const dow = new Date(d.date).getDay(); return dow === 0 || dow === 6; });
    if (weekendDays.length === 0) return; // skip if no weekend days in range
    const weekendAvg = weekendDays.reduce((s, d) => s + d.totalTokens, 0) / weekendDays.length;
    expect(weekdayAvg).toBeGreaterThan(weekendAvg);
  });

  it('getRecentOtelEvents returns events sorted newest-first', () => {
    const events = getRecentOtelEvents(20);
    for (let i = 1; i < events.length; i++) {
      expect(new Date(events[i - 1].timestamp).getTime())
        .toBeGreaterThanOrEqual(new Date(events[i].timestamp).getTime());
    }
  });

  it('getOrgSummary totalTokens equals sum across all teams', () => {
    const summary = getOrgSummary('30d');
    expect(summary.totalTokens).toBe(
      summary.totalInputTokens + summary.totalOutputTokens + summary.totalCacheReadTokens
    );
  });

  it('seeded data is deterministic across multiple calls', () => {
    const events1 = getRecentOtelEvents(10);
    const events2 = getRecentOtelEvents(10);
    expect(events1.map(e => e.eventId)).toEqual(events2.map(e => e.eventId));
    expect(events1.map(e => e.teamId)).toEqual(events2.map(e => e.teamId));
    expect(events1.map(e => e.eventType)).toEqual(events2.map(e => e.eventType));

    const perms1 = getTeamPermissions();
    const perms2 = getTeamPermissions();
    expect(perms1).toEqual(perms2);
  });
});
