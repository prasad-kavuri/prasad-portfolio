import { describe, expect, it } from 'vitest';
import { evaluateWorldOutput, validateWorldOutputShape } from '@/lib/world-eval';
import { buildWorldGeneration } from '@/lib/world-generation';

describe('world generation eval', () => {
  it('passes complete approved world output', async () => {
    const output = await buildWorldGeneration({
      traceId: 'trace-world-1',
      prompt: 'Generate a 3D downtown delivery zone with curbside loading and pedestrian-safe buffers.',
      region: 'Downtown Core',
      objective: 'cost',
      style: 'logistics-grid',
      provider: 'mock',
      simulationReady: true,
      constraints: {
        budgetLevel: 'medium',
        congestionSensitivity: 'medium',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
      approvalState: 'approved',
    });

    const evalResult = evaluateWorldOutput(output);
    expect(evalResult.passed).toBe(true);
    expect(evalResult.score).toBe(1);
  });

  it('reports shape issues for incomplete payload', async () => {
    const output = await buildWorldGeneration({
      traceId: 'trace-world-2',
      prompt: 'Create a transit district world concept with policy-safe pickups and accessible routing.',
      region: 'Transit District',
      objective: 'speed',
      style: 'mobility-corridor',
      provider: 'mock',
      simulationReady: false,
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
      worldArtifact: {
        ...output.worldArtifact,
        preview: {
          ...output.worldArtifact.preview,
          cells: [],
        },
      },
      proposedRecommendation: {
        ...output.proposedRecommendation,
        tradeoffs: [],
      },
    };

    const issues = validateWorldOutputShape(broken);
    expect(issues).toContain('trace_incomplete');
    expect(issues).toContain('missing_world_preview');
    expect(issues).toContain('missing_tradeoffs');
  });

  it('flags policy trace and approval-state mismatches', async () => {
    const output = await buildWorldGeneration({
      traceId: 'trace-world-3',
      prompt: 'Generate mixed-use world concept for transit-adjacent logistics and safety checks.',
      region: 'Transit District',
      objective: 'coverage',
      style: 'urban-mixed-use',
      provider: 'mock',
      simulationReady: true,
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

    const evalResult = evaluateWorldOutput(mismatched);
    const byId = Object.fromEntries(evalResult.checks.map((check) => [check.id, check]));

    expect(byId.policy_trace_present.passed).toBe(false);
    expect(byId.constraints_stated.passed).toBe(false);
    expect(byId.tradeoff_stated.passed).toBe(false);
    expect(byId.approval_state_consistent.passed).toBe(false);
    expect(evalResult.passed).toBe(false);
  });
});
