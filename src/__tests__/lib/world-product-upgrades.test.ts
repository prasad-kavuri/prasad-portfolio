import { describe, expect, it } from 'vitest';
import { buildWorldGeneration } from '@/lib/world-generation';
import { buildCanonicalArtifact } from '@/lib/world-workflow-state';
import {
  approvalStatusLabel,
  buildScenarioComparisonSummary,
  buildScenarioVariants,
  deriveApprovalStatus,
  transitionApprovalStatus,
} from '@/lib/world-product-upgrades';

describe('world product upgrades helpers', () => {
  it('derives approval status for human and auto-approved flows', () => {
    expect(
      deriveApprovalStatus({
        requiresHumanApproval: true,
        workflowStatus: 'approval',
        outputStatus: 'pending_review',
      })
    ).toBe('awaiting');

    expect(
      deriveApprovalStatus({
        requiresHumanApproval: false,
        workflowStatus: 'completed',
        outputStatus: 'completed',
      })
    ).toBe('auto_approved');
  });

  it('transitions approval states deterministically', () => {
    expect(transitionApprovalStatus('awaiting', 'approve')).toBe('approved');
    expect(transitionApprovalStatus('awaiting', 'revise')).toBe('revision_requested');
    expect(transitionApprovalStatus('awaiting', 'cancel')).toBe('cancelled');
    expect(transitionApprovalStatus('auto_approved', 'cancel')).toBe('auto_approved');
    expect(approvalStatusLabel('revision_requested')).toMatch(/Revision requested/i);
  });

  it('builds baseline, speed, and safety comparison variants with summaries', async () => {
    const payload = await buildWorldGeneration({
      traceId: 'trace-scenario-helpers',
      prompt: 'Generate a governed downtown world for corridor planning.',
      region: 'Downtown Core',
      objective: 'speed',
      style: 'logistics-grid',
      provider: 'mock',
      approvalState: 'pending',
      simulationReady: true,
      constraints: {
        budgetLevel: 'medium',
        congestionSensitivity: 'high',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
    });

    const artifact = buildCanonicalArtifact(payload);
    const variants = buildScenarioVariants({
      artifact,
      recommendation: payload.proposedRecommendation,
    });

    expect(variants.map((variant) => variant.id)).toEqual(['baseline', 'speed', 'safety']);
    expect(variants[1].summary).toMatch(/throughput/i);
    expect(variants[2].summary).toMatch(/protected zones/i);
    expect(buildScenarioComparisonSummary(variants[1])).toMatch(/throughput/i);
    expect(buildScenarioComparisonSummary(variants[2])).toMatch(/separation/i);
  });
});
