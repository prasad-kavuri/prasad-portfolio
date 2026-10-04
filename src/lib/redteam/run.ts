/**
 * Runs the red-team corpus and summarizes it (SPEC-0023). Pure and deterministic, so the same
 * report is produced in CI, at build time for /security/red-team, and for the JSON endpoint.
 */
import { RED_TEAM_CASES, type RedTeamCase, type RedTeamExpectation, type RedTeamLayer } from '@/lib/redteam/cases';

export type RedTeamResult = 'blocked' | 'missed' | 'allowed' | 'false_positive';

export interface RedTeamCaseReport {
  id: string;
  title: string;
  layer: RedTeamLayer;
  technique: string;
  risks: string[];
  expected: RedTeamExpectation;
  result: RedTeamResult;
  /** True when the result matches the expectation (a documented known gap that still misses counts as passing). */
  asExpected: boolean;
  mitigation?: string;
}

export interface RedTeamReport {
  suite: string;
  frameworks: string[];
  totals: {
    cases: number;
    attacks: number;
    attacksBlocked: number;
    knownGaps: number;
    benign: number;
    falsePositives: number;
    unexpected: number;
  };
  byLayer: Record<string, { attacks: number; blocked: number }>;
  byRisk: Record<string, { attacks: number; blocked: number }>;
  cases: RedTeamCaseReport[];
}

function runCase(c: RedTeamCase): RedTeamCaseReport {
  let passedProbe: boolean;
  try {
    passedProbe = c.probe();
  } catch {
    passedProbe = false;
  }
  const benign = c.expected === 'allowed';
  const result: RedTeamResult = benign ? (passedProbe ? 'allowed' : 'false_positive') : passedProbe ? 'blocked' : 'missed';
  const asExpected =
    (c.expected === 'blocked' && result === 'blocked') ||
    (c.expected === 'allowed' && result === 'allowed') ||
    (c.expected === 'known_gap' && result === 'missed');
  return {
    id: c.id,
    title: c.title,
    layer: c.layer,
    technique: c.technique,
    risks: c.risks,
    expected: c.expected,
    result,
    asExpected,
    ...(c.mitigation ? { mitigation: c.mitigation } : {}),
  };
}

export function runRedTeam(cases: RedTeamCase[] = RED_TEAM_CASES): RedTeamReport {
  const reports = cases.map(runCase);
  const attacks = reports.filter((r) => r.expected !== 'allowed');
  const byLayer: RedTeamReport['byLayer'] = {};
  const byRisk: RedTeamReport['byRisk'] = {};
  for (const r of attacks) {
    const blocked = r.result === 'blocked' ? 1 : 0;
    byLayer[r.layer] = { attacks: (byLayer[r.layer]?.attacks ?? 0) + 1, blocked: (byLayer[r.layer]?.blocked ?? 0) + blocked };
    for (const risk of r.risks) {
      byRisk[risk] = { attacks: (byRisk[risk]?.attacks ?? 0) + 1, blocked: (byRisk[risk]?.blocked ?? 0) + blocked };
    }
  }
  return {
    suite: 'prasadkavuri.com red-team corpus (SPEC-0023)',
    frameworks: ['OWASP Top 10 for LLM Applications 2025', 'OWASP Top 10 for Agentic Applications 2026'],
    totals: {
      cases: reports.length,
      attacks: attacks.length,
      attacksBlocked: attacks.filter((r) => r.result === 'blocked').length,
      knownGaps: reports.filter((r) => r.expected === 'known_gap').length,
      benign: reports.length - attacks.length,
      falsePositives: reports.filter((r) => r.result === 'false_positive').length,
      unexpected: reports.filter((r) => !r.asExpected).length,
    },
    byLayer,
    byRisk,
    cases: reports,
  };
}
