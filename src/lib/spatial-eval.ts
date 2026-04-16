import type { SpatialSimulationOutput } from '@/lib/spatial-simulation';

export type SpatialEvalCheck = {
  id: string;
  passed: boolean;
  detail: string;
};

export type SpatialEvalResult = {
  passed: boolean;
  score: number;
  checks: SpatialEvalCheck[];
};

export function validateSpatialSimulationShape(output: SpatialSimulationOutput): string[] {
  const issues: string[] = [];

  if (!output.traceId) issues.push('missing_trace_id');
  if (!output.scenario?.prompt) issues.push('missing_scenario_prompt');
  if (!Array.isArray(output.workflow) || output.workflow.length < 7) issues.push('workflow_incomplete');
  if (!Array.isArray(output.traces) || output.traces.length < 5) issues.push('trace_incomplete');
  if (!output.proposedRecommendation?.headline) issues.push('missing_recommendation_headline');
  if (!output.proposedRecommendation?.rationale) issues.push('missing_recommendation_rationale');
  if (!output.proposedRecommendation?.tradeoffs?.length) issues.push('missing_tradeoffs');
  if (!output.proposedRecommendation?.constraintsApplied?.length) issues.push('missing_constraints');

  return issues;
}

export function evaluateSpatialSimulation(output: SpatialSimulationOutput): SpatialEvalResult {
  const checks: SpatialEvalCheck[] = [];

  const shapeIssues = validateSpatialSimulationShape(output);
  checks.push({
    id: 'shape_valid',
    passed: shapeIssues.length === 0,
    detail: shapeIssues.length === 0 ? 'Structured response payload is complete.' : shapeIssues.join(', '),
  });

  const hasPolicyTrace = output.traces.some((trace) => /policy/i.test(trace.actor));
  checks.push({
    id: 'policy_trace_present',
    passed: hasPolicyTrace,
    detail: hasPolicyTrace ? 'Policy review trace present.' : 'Policy review trace missing.',
  });

  const mentionsConstraints = output.proposedRecommendation.constraintsApplied.length >= 2;
  checks.push({
    id: 'constraints_applied',
    passed: mentionsConstraints,
    detail: mentionsConstraints ? 'Recommendation includes applied constraints.' : 'Recommendation missing applied constraints.',
  });

  const includesTradeoff = output.proposedRecommendation.tradeoffs.length > 0;
  checks.push({
    id: 'tradeoff_stated',
    passed: includesTradeoff,
    detail: includesTradeoff ? 'Tradeoffs included for executive review.' : 'No tradeoff statement found.',
  });

  const approvalSignalConsistent =
    output.status === 'completed'
      ? output.governance.evaluationStatus === 'pass'
      : output.governance.evaluationStatus === 'review';
  checks.push({
    id: 'approval_state_consistent',
    passed: approvalSignalConsistent,
    detail: approvalSignalConsistent
      ? 'Evaluation status aligns with approval checkpoint.'
      : 'Evaluation status does not align with approval checkpoint.',
  });

  const passedCount = checks.filter((check) => check.passed).length;
  const score = Number((passedCount / checks.length).toFixed(2));

  return {
    passed: passedCount === checks.length,
    score,
    checks,
  };
}
