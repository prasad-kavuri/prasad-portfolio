import { describe, expect, it } from 'vitest';
import {
  INITIAL_WORLD_WORKFLOW_STATE,
  buildArtifactSession,
  buildCanonicalArtifact,
  validateCanonicalArtifact,
  validateRenderableArtifact,
  worldWorkflowReducer,
} from '@/lib/world-workflow-state';
import { buildWorldGeneration } from '@/lib/world-generation';

describe('world workflow state sequencing', () => {
  it('blocks approval before artifact-ready state', () => {
    const fromGenerating = worldWorkflowReducer(
      { status: 'generating', errorMessage: '', artifactSession: null },
      { type: 'ENTER_APPROVAL' }
    );
    expect(fromGenerating.status).toBe('error');
    expect(fromGenerating.errorMessage).toMatch(/Approval blocked/i);
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
    expect(check.renderablePrimitiveCount).toBeGreaterThan(0);
    expect(check.previewCellCount).toBeGreaterThan(0);
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

  it('persists canonical artifact through artifact_ready -> approval -> completed', async () => {
    const payload = await buildWorldGeneration({
      traceId: 'trace-workflow-complete',
      prompt: 'Generate a governed world with simulation-ready corridors.',
      region: 'Downtown Core',
      objective: 'speed',
      style: 'logistics-grid',
      provider: 'mock',
      simulationReady: true,
      constraints: {
        budgetLevel: 'medium',
        congestionSensitivity: 'high',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
      approvalState: 'pending',
    });

    const session = buildArtifactSession(payload);
    const ready = worldWorkflowReducer(INITIAL_WORLD_WORKFLOW_STATE, { type: 'SET_ARTIFACT_READY', session });
    const approval = worldWorkflowReducer(ready, { type: 'ENTER_APPROVAL' });
    const completed = worldWorkflowReducer(approval, { type: 'APPROVE_ARTIFACT', note: 'Approved for release' });

    expect(ready.status).toBe('artifact_ready');
    expect(approval.status).toBe('approval');
    expect(approval.artifactSession?.artifact.worldId).toBe(session.artifact.worldId);
    expect(completed.status).toBe('completed');
    expect(completed.artifactSession?.artifact.worldId).toBe(session.artifact.worldId);
    expect(completed.artifactSession?.artifact.approvalNotes).toContain('Approved for release');
    expect(completed.artifactSession?.response.status).toBe('completed');
  });

  it('handles workflow reducer status transitions, completion guards, and reset', async () => {
    let state = worldWorkflowReducer(INITIAL_WORLD_WORKFLOW_STATE, { type: 'BEGIN_VALIDATING' });
    expect(state.status).toBe('validating');
    state = worldWorkflowReducer(state, { type: 'BEGIN_GENERATING' });
    expect(state.status).toBe('generating');
    state = worldWorkflowReducer(state, { type: 'BEGIN_STRUCTURING' });
    expect(state.status).toBe('structuring');
    state = worldWorkflowReducer(state, { type: 'BEGIN_REVIEWING' });
    expect(state.status).toBe('reviewing');
    state = worldWorkflowReducer(state, { type: 'SET_ERROR', message: 'Generation failed' });
    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('Generation failed');
    expect(worldWorkflowReducer(state, { type: 'RESET' })).toBe(INITIAL_WORLD_WORKFLOW_STATE);

    const blocked = worldWorkflowReducer(INITIAL_WORLD_WORKFLOW_STATE, { type: 'ENTER_COMPLETED' });
    expect(blocked.status).toBe('error');
    expect(blocked.errorMessage).toMatch(/Completion blocked/i);

    const payload = await buildWorldGeneration({
      traceId: 'trace-workflow-enter-completed',
      prompt: 'Generate a governed world with simulation-ready corridors.',
      region: 'Downtown Core',
      objective: 'speed',
      style: 'logistics-grid',
      provider: 'mock',
      simulationReady: true,
      constraints: {
        budgetLevel: 'medium',
        congestionSensitivity: 'high',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
      approvalState: 'pending',
    });
    const session = buildArtifactSession(payload);
    const ready = worldWorkflowReducer(INITIAL_WORLD_WORKFLOW_STATE, { type: 'SET_ARTIFACT_READY', session });
    expect(worldWorkflowReducer(ready, { type: 'ENTER_COMPLETED' }).status).toBe('completed');
  });

  it('blocks approval when no valid artifact is available and accepts blank approval notes', async () => {
    const blocked = worldWorkflowReducer(INITIAL_WORLD_WORKFLOW_STATE, { type: 'APPROVE_ARTIFACT' });
    expect(blocked.status).toBe('error');
    expect(blocked.errorMessage).toMatch(/no valid artifact/i);

    const payload = await buildWorldGeneration({
      traceId: 'trace-workflow-blank-note',
      prompt: 'Generate a governed world with simulation-ready corridors.',
      region: 'Downtown Core',
      objective: 'speed',
      style: 'logistics-grid',
      provider: 'mock',
      simulationReady: true,
      constraints: {
        budgetLevel: 'medium',
        congestionSensitivity: 'high',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
      approvalState: 'pending',
    });
    const ready = worldWorkflowReducer(INITIAL_WORLD_WORKFLOW_STATE, {
      type: 'SET_ARTIFACT_READY',
      session: buildArtifactSession(payload),
    });
    const completed = worldWorkflowReducer(ready, { type: 'APPROVE_ARTIFACT', note: '   ' });
    expect(completed.status).toBe('completed');
    expect(completed.artifactSession?.artifact.approvalNotes).toEqual([]);
  });

  it('rejects approval transitions when canonical artifact is not renderable', async () => {
    const payload = await buildWorldGeneration({
      traceId: 'trace-workflow-not-renderable',
      prompt: 'Generate a world concept.',
      region: 'Downtown Core',
      objective: 'cost',
      style: 'logistics-grid',
      provider: 'mock',
      simulationReady: true,
      constraints: {
        budgetLevel: 'low',
        congestionSensitivity: 'medium',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
      approvalState: 'pending',
    });

    const artifact = buildCanonicalArtifact(payload);
    const brokenArtifact = {
      ...artifact,
      sceneSpec: {
        ...artifact.sceneSpec,
        primitives: [],
      },
    };
    const invalidSession = {
      response: payload,
      artifact: brokenArtifact,
      validation: validateCanonicalArtifact(brokenArtifact),
    };

    const ready = worldWorkflowReducer(INITIAL_WORLD_WORKFLOW_STATE, { type: 'SET_ARTIFACT_READY', session: invalidSession });
    const approval = worldWorkflowReducer(ready, { type: 'ENTER_APPROVAL' });

    expect(ready.status).toBe('artifact_ready');
    expect(ready.artifactSession?.validation.valid).toBe(false);
    expect(approval.status).toBe('error');
    expect(approval.errorMessage).toMatch(/Approval blocked/i);
  });

  it('validates canonical artifacts with missing structural fields', async () => {
    const payload = await buildWorldGeneration({
      traceId: 'trace-workflow-structural-validation',
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

    const artifact = buildCanonicalArtifact(payload);
    const invalid = validateCanonicalArtifact({
      ...artifact,
      sceneSpec: {
        ...artifact.sceneSpec,
        worldId: '',
        exportReadiness: 'ready',
        primitives: [],
      },
      preview: {
        ...artifact.preview,
        cells: [],
      },
      sceneZones: [],
      routeCorridors: [],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.reasons).toEqual(expect.arrayContaining([
      'scene_spec_missing',
      'scene_primitives_missing',
      'renderable_scene_missing',
      'preview_cells_missing',
      'scene_zones_missing',
      'route_corridors_missing',
      'export_marked_ready_but_invalid',
    ]));
  });
});
