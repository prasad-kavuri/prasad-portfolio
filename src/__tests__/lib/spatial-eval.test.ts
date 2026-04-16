import { describe, expect, it } from 'vitest';
import { evaluateSpatialSimulation, validateSpatialSimulationShape } from '@/lib/spatial-eval';
import { buildSpatialSimulation } from '@/lib/spatial-simulation';

describe('spatial simulation eval', () => {
  it('passes complete approved simulation output', () => {
    const output = buildSpatialSimulation({
      traceId: 'trace-spatial-1',
      scenarioPrompt: 'Optimize downtown delivery staging near mixed-use corridors with policy-safe curb behavior.',
      region: 'Downtown Core',
      objective: 'cost',
      constraints: {
        budgetLevel: 'medium',
        congestionSensitivity: 'medium',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
      approvalState: 'approved',
    });

    const evalResult = evaluateSpatialSimulation(output);
    expect(evalResult.passed).toBe(true);
    expect(evalResult.score).toBe(1);
  });

  it('reports shape issues for incomplete payload', () => {
    const output = buildSpatialSimulation({
      traceId: 'trace-spatial-2',
      scenarioPrompt: 'Evaluate pickup placement around transit hubs with clear safety constraints and budget controls.',
      region: 'Transit District',
      objective: 'speed',
      constraints: {
        budgetLevel: 'medium',
        congestionSensitivity: 'medium',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
      approvalState: 'pending',
    });

    const broken = {
      ...output,
      traces: [],
      proposedRecommendation: {
        ...output.proposedRecommendation,
        tradeoffs: [],
      },
    };

    const issues = validateSpatialSimulationShape(broken);
    expect(issues).toContain('trace_incomplete');
    expect(issues).toContain('missing_tradeoffs');
  });

  it('flags policy trace and approval-state mismatches', () => {
    const output = buildSpatialSimulation({
      traceId: 'trace-spatial-3',
      scenarioPrompt: 'Assess transit district routing with balanced constraints and policy-safe execution.',
      region: 'Transit District',
      objective: 'coverage',
      constraints: {
        budgetLevel: 'medium',
        congestionSensitivity: 'medium',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
      approvalState: 'pending',
    });

    const mismatched = {
      ...output,
      traces: output.traces.filter((trace) => !/policy/i.test(trace.actor)),
      governance: {
        ...output.governance,
        evaluationStatus: 'pass' as const,
      },
      proposedRecommendation: {
        ...output.proposedRecommendation,
        constraintsApplied: ['Limited curb inventory'],
        tradeoffs: [],
      },
    };

    const evalResult = evaluateSpatialSimulation(mismatched);
    const byId = Object.fromEntries(evalResult.checks.map((check) => [check.id, check]));

    expect(byId.policy_trace_present.passed).toBe(false);
    expect(byId.constraints_applied.passed).toBe(false);
    expect(byId.tradeoff_stated.passed).toBe(false);
    expect(byId.approval_state_consistent.passed).toBe(false);
    expect(evalResult.passed).toBe(false);
  });

  it('catches missing core shape fields', () => {
    const output = buildSpatialSimulation({
      traceId: 'trace-spatial-4',
      scenarioPrompt: 'Evaluate airport corridor staging with strict safety and congestion constraints.',
      region: 'Airport Corridor',
      objective: 'safety',
      constraints: {
        budgetLevel: 'high',
        congestionSensitivity: 'high',
        accessibilityPriority: true,
        policyProfile: 'safety-first',
      },
      approvalState: 'approved',
    });

    const broken = {
      ...output,
      traceId: '',
      scenario: {
        ...output.scenario,
        prompt: '',
      },
      workflow: output.workflow.slice(0, 3),
      proposedRecommendation: {
        ...output.proposedRecommendation,
        headline: '',
        rationale: '',
        constraintsApplied: [],
      },
    };

    const issues = validateSpatialSimulationShape(broken);
    expect(issues).toContain('missing_trace_id');
    expect(issues).toContain('missing_scenario_prompt');
    expect(issues).toContain('workflow_incomplete');
    expect(issues).toContain('missing_recommendation_headline');
    expect(issues).toContain('missing_recommendation_rationale');
    expect(issues).toContain('missing_constraints');
  });
});
