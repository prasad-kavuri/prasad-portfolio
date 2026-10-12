import { describe, it, expect } from 'vitest';
import { RED_TEAM_CASES, looksLikeSecret } from '@/lib/redteam/cases';
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
  it('every known gap names backstop cases that exist, are not gaps themselves, and pass', () => {
    for (const gap of RED_TEAM_CASES.filter((x) => x.expected === 'known_gap')) {
      expect(gap.backstops?.length, `${gap.id} must list the cases that verify its backstop`).toBeGreaterThan(0);
      for (const id of gap.backstops ?? []) {
        const backstop = report.cases.find((c) => c.id === id);
        expect(backstop, `${gap.id} -> ${id} must exist`).toBeDefined();
        expect(backstop?.expected, `${id} must not itself be a gap`).not.toBe('known_gap');
        expect(backstop?.asExpected, `${id} must pass for ${gap.id}'s backstop to hold`).toBe(true);
      }
    }
  });

  it('the credential detector has teeth: it flags secrets and ignores ordinary profile text', () => {
    // Assemble the synthetic AWS fixture so repository scanners do not flag it.
    const fakeAwsKey = ['AKIA', 'ABCDEFGHIJKLMNOP'].join('');
    for (const secret of ['key sk-abcdefghijklmnop1234', 'gsk_abcdefghijklmnop1234', fakeAwsKey, '-----BEGIN RSA PRIVATE KEY-----', 'api_key: abc', 'password = hunter2', 'GROQ_API_KEY', 'UPSTASH_REDIS_REST_TOKEN', 'Authorization: Bearer abcdefghijklmnop1234']) {
      expect(looksLikeSecret(secret), secret).toBe(true);
    }
    for (const plain of ['Led 200+ engineers and cut costs 70% at Ola.', 'Built a RAG pipeline with all-MiniLM-L6-v2.']) {
      expect(looksLikeSecret(plain), plain).toBe(false);
    }
  });
});
