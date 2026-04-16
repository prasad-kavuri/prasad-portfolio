import type { WorldGenerationOutput } from '@/lib/world-generation';
import { validateWorldSceneSpec } from '@/lib/world-assets';

export type WorldEvalCheck = {
  id: string;
  passed: boolean;
  detail: string;
};

export type WorldEvalResult = {
  passed: boolean;
  score: number;
  checks: WorldEvalCheck[];
};

export function validateWorldOutputShape(output: WorldGenerationOutput): string[] {
  const issues: string[] = [];

  if (!output.traceId) issues.push('missing_trace_id');
  if (!output.scenario?.prompt) issues.push('missing_prompt');
  if (!Array.isArray(output.workflow) || output.workflow.length < 7) issues.push('workflow_incomplete');
  if (!Array.isArray(output.traces) || output.traces.length < 5) issues.push('trace_incomplete');
  if (!output.worldArtifact?.worldTitle) issues.push('missing_world_title');
  if (!output.worldArtifact?.preview?.cells?.length) issues.push('missing_world_preview');
  if (!output.worldArtifact?.sceneSpec || !output.worldArtifact.sceneSpec.primitives?.length) issues.push('missing_scene_spec');
  if (!output.worldArtifact?.assets?.sceneZones?.length) issues.push('missing_scene_zones');
  if (!output.proposedRecommendation?.headline) issues.push('missing_recommendation_headline');
  if (!output.proposedRecommendation?.tradeoffs?.length) issues.push('missing_tradeoffs');
  if (!output.proposedRecommendation?.constraintsApplied?.length) issues.push('missing_constraints');

  return issues;
}

export function evaluateWorldOutput(output: WorldGenerationOutput): WorldEvalResult {
  const checks: WorldEvalCheck[] = [];

  const shapeIssues = validateWorldOutputShape(output);
  checks.push({
    id: 'shape_valid',
    passed: shapeIssues.length === 0,
    detail: shapeIssues.length === 0 ? 'Structured world output is complete.' : shapeIssues.join(','),
  });

  const hasPolicyTrace = output.traces.some((trace) => /policy/i.test(trace.actor));
  checks.push({
    id: 'policy_trace_present',
    passed: hasPolicyTrace,
    detail: hasPolicyTrace ? 'Policy review trace present.' : 'Policy review trace missing.',
  });

  const hasProviderDisclosure = output.worldArtifact.availability === 'available' || output.worldArtifact.availability === 'fallback';
  checks.push({
    id: 'provider_disclosure_present',
    passed: hasProviderDisclosure,
    detail: hasProviderDisclosure ? 'Provider mode disclosure present.' : 'Provider disclosure missing.',
  });

  const includesTradeoff = output.proposedRecommendation.tradeoffs.length > 0;
  checks.push({
    id: 'tradeoff_stated',
    passed: includesTradeoff,
    detail: includesTradeoff ? 'Tradeoffs included.' : 'Tradeoff statement missing.',
  });

  const includesConstraints = output.proposedRecommendation.constraintsApplied.length >= 2;
  checks.push({
    id: 'constraints_stated',
    passed: includesConstraints,
    detail: includesConstraints ? 'Constraints included.' : 'Constraint coverage is insufficient.',
  });

  const sceneValidation = output.worldArtifact.sceneSpec
    ? validateWorldSceneSpec(output.worldArtifact.sceneSpec)
    : { isValid: false, reasons: ['scene_spec_missing'] };
  checks.push({
    id: 'scene_spec_valid',
    passed: sceneValidation.isValid,
    detail: sceneValidation.isValid ? 'Scene specification validated.' : sceneValidation.reasons.join(','),
  });

  const exportReadinessConsistent = output.worldArtifact.sceneSpec
    ? output.worldArtifact.sceneSpec.exportReadiness === output.worldArtifact.assets.simulationReadiness
    : false;
  checks.push({
    id: 'export_readiness_consistent',
    passed: exportReadinessConsistent,
    detail: exportReadinessConsistent
      ? 'Scene export readiness is aligned with simulation readiness.'
      : 'Scene export readiness mismatch.',
  });

  const approvalStateConsistent = output.status === 'completed'
    ? output.governance.evaluationStatus === 'pass'
    : output.governance.evaluationStatus === 'review';
  checks.push({
    id: 'approval_state_consistent',
    passed: approvalStateConsistent,
    detail: approvalStateConsistent ? 'Approval/evaluation state is consistent.' : 'Approval/evaluation mismatch.',
  });

  const passedCount = checks.filter((check) => check.passed).length;
  const score = Number((passedCount / checks.length).toFixed(2));

  return {
    passed: passedCount === checks.length,
    score,
    checks,
  };
}
