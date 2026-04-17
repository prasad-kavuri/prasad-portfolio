import { describe, expect, it } from 'vitest';
import {
  INITIAL_WORLD_WORKFLOW_STATE,
  validateRenderableArtifact,
  worldWorkflowReducer,
} from '@/lib/world-workflow-state';
import { buildWorldGeneration } from '@/lib/world-generation';

describe('world workflow state sequencing', () => {
  it('blocks approval before artifact-ready state', () => {
    const fromGenerating = worldWorkflowReducer({ lifecycle: 'generating', errorMessage: '' }, { type: 'ENTER_APPROVAL' });
    expect(fromGenerating.lifecycle).toBe('error');
    expect(fromGenerating.errorMessage).toMatch(/Approval blocked/i);
  });

  it('allows approval and completed transitions only from valid sequencing', () => {
    const ready = worldWorkflowReducer(INITIAL_WORLD_WORKFLOW_STATE, { type: 'ARTIFACT_READY' });
    const approval = worldWorkflowReducer(ready, { type: 'ENTER_APPROVAL' });
    const completed = worldWorkflowReducer(approval, { type: 'ENTER_COMPLETED' });

    expect(approval.lifecycle).toBe('approval');
    expect(completed.lifecycle).toBe('completed');
  });

  it('rejects null or empty artifact payloads', () => {
    const missing = validateRenderableArtifact(null);
    expect(missing.valid).toBe(false);
    expect(missing.reasons).toContain('artifact_missing');
  });

  it('accepts fallback artifacts when they are renderable and structured', async () => {
    const payload = await buildWorldGeneration({
      traceId: 'trace-workflow-fallback',
      prompt: 'Generate a transit-adjacent world concept with safety buffers and controlled pickup zones.',
      region: 'Transit District',
      objective: 'speed',
      style: 'mobility-corridor',
      provider: 'hyworld',
      simulationReady: true,
      constraints: {
        budgetLevel: 'medium',
        congestionSensitivity: 'high',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
      approvalState: 'pending',
    });

    expect(payload.worldArtifact.availability).toBe('fallback');
    const check = validateRenderableArtifact(payload);
    expect(check.valid).toBe(true);
    expect(check.exportEligible).toBe(true);
  });

  it('flags export-ready mismatches when scene is incomplete', async () => {
    const payload = await buildWorldGeneration({
      traceId: 'trace-workflow-incomplete',
      prompt: 'Generate a downtown operations world concept with policy-safe corridors and curbside zones.',
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
      approvalState: 'pending',
    });

    const broken = {
      ...payload,
      worldArtifact: {
        ...payload.worldArtifact,
        sceneSpec: {
          ...payload.worldArtifact.sceneSpec,
          primitives: [],
        },
      },
    };

    const check = validateRenderableArtifact(broken);
    expect(check.valid).toBe(false);
    expect(check.reasons).toContain('scene_primitives_missing');
  });
});
