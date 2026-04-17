import type { WorldRecommendation } from '@/lib/world-generation';
import type { WorldCanonicalArtifact } from '@/lib/world-workflow-state';

export type ApprovalStatus = 'awaiting' | 'approved' | 'revision_requested' | 'cancelled' | 'auto_approved';

export type ApprovalAction = 'approve' | 'revise' | 'cancel';

export type ScenarioVariantId = 'baseline' | 'speed' | 'safety';

export type ScenarioVariant = {
  id: ScenarioVariantId;
  label: string;
  objective: string;
  routeDifference: string;
  zoneDifference: string;
  complexity: string;
  policyNote: string;
  businessImpact: string;
  tradeoff: string;
  recommendation: string;
  summary: string;
};

export function deriveApprovalStatus(input: {
  requiresHumanApproval: boolean;
  workflowStatus: string;
  outputStatus: 'pending_review' | 'completed';
}): ApprovalStatus {
  if (!input.requiresHumanApproval) return 'auto_approved';
  if (input.workflowStatus === 'approval') return 'awaiting';
  if (input.outputStatus === 'completed') return 'approved';
  return 'awaiting';
}

export function transitionApprovalStatus(current: ApprovalStatus, action: ApprovalAction): ApprovalStatus {
  if (current === 'auto_approved') return 'auto_approved';
  if (action === 'approve') return 'approved';
  if (action === 'revise') return 'revision_requested';
  return 'cancelled';
}

export function approvalStatusLabel(status: ApprovalStatus): string {
  if (status === 'approved') return 'Approved';
  if (status === 'revision_requested') return 'Revision requested';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'auto_approved') return 'Auto-approved (low risk)';
  return 'Awaiting approval';
}

function corridorSummary(artifact: WorldCanonicalArtifact): string {
  return artifact.routeCorridors.slice(0, 2).join(', ') || 'Standard corridor allocation';
}

function zoneSummary(artifact: WorldCanonicalArtifact): string {
  return artifact.sceneZones.slice(0, 2).join(', ') || 'Balanced zone allocation';
}

export function buildScenarioVariants(input: {
  artifact: WorldCanonicalArtifact;
  recommendation: WorldRecommendation;
}): ScenarioVariant[] {
  const primitiveCount = input.artifact.primitiveCount;
  const budget = input.artifact.sceneSpec.primitiveBudget;
  const baselineComplexity = `${primitiveCount} / ${budget} primitives`;

  return [
    {
      id: 'baseline',
      label: 'Baseline',
      objective: input.artifact.sceneSpec.objective,
      routeDifference: corridorSummary(input.artifact),
      zoneDifference: zoneSummary(input.artifact),
      complexity: baselineComplexity,
      policyNote: 'Maintains the currently generated governance posture.',
      businessImpact: input.recommendation.businessImpact,
      tradeoff: input.recommendation.tradeoffs[0] ?? 'Balanced tradeoff profile.',
      recommendation: input.recommendation.nextAction,
      summary: 'Baseline scenario preserves the current governed world artifact.',
    },
    {
      id: 'speed',
      label: 'Speed-Optimized',
      objective: 'speed',
      routeDifference: 'Adds fast-path corridor priority and tighter lane sequencing.',
      zoneDifference: 'Slightly reduces buffer envelopes around low-risk zones.',
      complexity: `${Math.min(budget, primitiveCount + 2)} / ${budget} primitives`,
      policyNote: 'Requires extra operational monitoring in peak windows.',
      businessImpact: 'Improves route throughput and planning turnaround for delivery-heavy scenarios.',
      tradeoff: 'Higher throughput can reduce safety buffer coverage in secondary corridors.',
      recommendation: 'Use for time-critical routing windows with active oversight.',
      summary: 'Speed-optimized scenario improves route throughput but reduces safety buffer coverage.',
    },
    {
      id: 'safety',
      label: 'Safety-Optimized',
      objective: 'safety',
      routeDifference: 'Wider separation between primary corridors and pedestrian crossings.',
      zoneDifference: 'Expands policy buffer zones and protected transit interfaces.',
      complexity: `${Math.min(budget, primitiveCount + 4)} / ${budget} primitives`,
      policyNote: 'Strongest alignment for risk-sensitive governance profiles.',
      businessImpact: 'Improves policy confidence and incident prevention readiness.',
      tradeoff: 'Additional protected zones can reduce route efficiency in high-demand windows.',
      recommendation: 'Use for safety-first deployments and public-facing operations.',
      summary: 'Safety-optimized scenario increases protected zones and pedestrian separation at the cost of route efficiency.',
    },
  ];
}

export function buildScenarioComparisonSummary(variant: ScenarioVariant): string {
  if (variant.id === 'speed') {
    return 'Speed-optimized scenario improves route throughput but narrows safety coverage in lower-priority zones.';
  }
  if (variant.id === 'safety') {
    return 'Safety-optimized scenario raises protected zone coverage and separation controls while slowing peak route efficiency.';
  }
  return 'Baseline scenario keeps the current governed layout as the decision anchor.';
}
