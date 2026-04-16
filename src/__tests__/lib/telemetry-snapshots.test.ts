import { describe, it, expect } from 'vitest';
import { GOVERNANCE_SNAPSHOT, STATUS_SNAPSHOT, getGovernanceMetricsView } from '@/data/telemetry-snapshots';

describe('telemetry snapshots', () => {
  it('status snapshot has consistent, non-empty sections with precise timestamp', () => {
    expect(STATUS_SNAPSHOT.generatedAtIso).toMatch(/^\d{4}-\d{2}-\d{2}T.+Z$/);
    expect(STATUS_SNAPSHOT.services).toHaveLength(13);
    expect(STATUS_SNAPSHOT.securityPosture.length).toBeGreaterThan(0);
    expect(STATUS_SNAPSHOT.testSuite.length).toBeGreaterThan(0);
    expect(STATUS_SNAPSHOT.stack.length).toBeGreaterThan(0);
  });

  it('status snapshot service names are unique', () => {
    const names = STATUS_SNAPSHOT.services.map(([name]) => name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('AI Evaluation Showcase');
    expect(names).toContain('AI Spatial Intelligence & World Generation');
  });

  it('governance snapshot has centralized controls, logs, and deterministic metric snapshot', () => {
    expect(GOVERNANCE_SNAPSHOT.generatedAtIso).toMatch(/^\d{4}-\d{2}-\d{2}T.+Z$/);
    expect(GOVERNANCE_SNAPSHOT.policyControls.length).toBeGreaterThan(0);
    expect(GOVERNANCE_SNAPSHOT.auditLog.length).toBeGreaterThan(0);

    const baseline = GOVERNANCE_SNAPSHOT.metricSnapshot;
    expect(baseline.rateLimitTotal).toBeGreaterThan(0);
    expect(baseline.rateLimitRemaining).toBeGreaterThan(0);
    expect(baseline.costPerInteractionUsd).toBeGreaterThan(0);
    expect(baseline.evalFidelity).toBeGreaterThan(0);
  });

  it('builds governance metrics from deterministic snapshot fallback', () => {
    const view = getGovernanceMetricsView(undefined, 'Updated 12:00:00');
    const labels = view.cards.map(([label]) => label);
    expect(labels).toContain('Rate Limit Remaining');
    expect(labels).toContain('Eval Fidelity Score');
    expect(view.updatedLabel).toBe('Updated 12:00:00');
  });

  it('uses live eval snapshot values when available', () => {
    const view = getGovernanceMetricsView({
      totalQueriesLogged: 41,
      liveEval: { casesRun: 10, passed: 9, avgScore: 0.97 },
      drift: { assistantSamples: 2, multiAgentSamples: 1 },
    });

    const fidelityCard = view.cards.find(([label]) => label === 'Eval Fidelity Score');
    const hallucinationCard = view.cards.find(([label]) => label === 'Hallucination Rate');
    const queriesCard = view.cards.find(([label]) => label === 'Queries Logged');

    expect(fidelityCard?.[1]).toBe('0.97');
    expect(hallucinationCard?.[1]).toBe('0.010');
    expect(queriesCard?.[1]).toBe('41');
  });
});
