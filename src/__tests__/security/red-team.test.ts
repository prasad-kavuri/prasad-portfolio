import { describe, it, expect } from 'vitest';
import { RED_TEAM_CASES } from '@/lib/redteam/cases';
import { runRedTeam } from '@/lib/redteam/run';

/**
 * Continuous red-team gate (SPEC-0023). The corpus runs against the portfolio's own guardrails,
 * tool gateway, agent policy, approval flow, and release gate on every push. CI fails if any case
 * stops behaving as documented — a newly missed attack, or a benign input newly flagged.
 */
describe('red-team corpus', () => {
  const report = runRedTeam();

  it('every attack behaves as documented (no regressions, no surprises)', () => {
    const unexpected = report.cases.filter((c) => !c.asExpected);
    expect(unexpected.map((c) => `${c.id}:${c.result}`)).toEqual([]);
    expect(report.totals.unexpected).toBe(0);
  });

  it('raises no false positives on benign inputs', () => {
    const fp = report.cases.filter((c) => c.result === 'false_positive');
    expect(fp.map((c) => c.id)).toEqual([]);
  });

  it('blocks every attack except the explicitly documented known gaps', () => {
    expect(report.totals.attacksBlocked).toBe(report.totals.attacks - report.totals.knownGaps);
  });

  it('every known gap names the control that still prevents harm', () => {
    for (const c of RED_TEAM_CASES.filter((x) => x.expected === 'known_gap')) {
      expect(c.mitigation, `${c.id} must document a backstop`).toBeTruthy();
    }
  });

  it('every case is tagged with at least one OWASP risk id', () => {
    for (const c of RED_TEAM_CASES) {
      const owasp = c.risks.filter((r) => /^(LLM|ASI)\d\d$/.test(r));
      if (c.expected === 'allowed') continue;
      expect(owasp.length, `${c.id} must carry an OWASP id`).toBeGreaterThan(0);
    }
  });

  it('has unique case ids', () => {
    const ids = RED_TEAM_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
