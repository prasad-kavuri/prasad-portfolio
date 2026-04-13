import { describe, it, expect } from 'vitest';
import { GOVERNANCE_SNAPSHOT, STATUS_SNAPSHOT } from '@/data/telemetry-snapshots';

describe('telemetry snapshots', () => {
  it('status snapshot has consistent, non-empty sections', () => {
    expect(STATUS_SNAPSHOT.generatedAtIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(STATUS_SNAPSHOT.services.length).toBeGreaterThan(0);
    expect(STATUS_SNAPSHOT.securityPosture.length).toBeGreaterThan(0);
    expect(STATUS_SNAPSHOT.testSuite.length).toBeGreaterThan(0);
    expect(STATUS_SNAPSHOT.stack.length).toBeGreaterThan(0);
  });

  it('status snapshot service names are unique', () => {
    const names = STATUS_SNAPSHOT.services.map(([name]) => name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('governance snapshot has centralized controls, logs, and metric baselines', () => {
    expect(GOVERNANCE_SNAPSHOT.generatedAtIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(GOVERNANCE_SNAPSHOT.policyControls.length).toBeGreaterThan(0);
    expect(GOVERNANCE_SNAPSHOT.auditLog.length).toBeGreaterThan(0);

    const baseline = GOVERNANCE_SNAPSHOT.metricBaselines;
    expect(baseline.rateLimitTotal).toBeGreaterThan(0);
    expect(baseline.rateLimitRemaining.base).toBeGreaterThan(0);
    expect(baseline.costPerInteractionUsd.base).toBeGreaterThan(0);
    expect(baseline.evalFidelityFallback.base).toBeGreaterThan(0);
  });
});

