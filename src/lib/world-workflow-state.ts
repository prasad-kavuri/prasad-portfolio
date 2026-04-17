import { getWorldExportEligibility, mapSceneSpecToRenderablePrimitives } from '@/lib/world-3d';
import type { WorldGenerationOutput } from '@/lib/world-generation';

export type WorldWorkflowStatus =
  | 'idle'
  | 'validating'
  | 'generating'
  | 'structuring'
  | 'reviewing'
  | 'artifact_ready'
  | 'approval'
  | 'completed'
  | 'error';

export type WorldCanonicalArtifact = {
  worldId: string;
  worldTitle: string;
  providerMode: WorldGenerationOutput['worldArtifact']['providerMode'];
  provider: string;
  availability: WorldGenerationOutput['worldArtifact']['availability'];
  sceneSpec: WorldGenerationOutput['worldArtifact']['sceneSpec'];
  preview: WorldGenerationOutput['worldArtifact']['preview'];
  primitiveCount: number;
  meshConcept: string;
  representation: WorldGenerationOutput['worldArtifact']['assets']['representation'];
  sceneZones: string[];
  routeCorridors: string[];
  exportReady: boolean;
  simulationReady: boolean;
  policyReviewResult: WorldGenerationOutput['governance']['policyValidation'];
  approvalState: WorldGenerationOutput['status'];
  approvalNotes: string[];
  warnings: string[];
  fallbackActive: boolean;
};

export type WorldArtifactSession = {
  response: WorldGenerationOutput;
  artifact: WorldCanonicalArtifact;
  validation: ArtifactValidationResult;
};

export type WorldWorkflowState = {
  status: WorldWorkflowStatus;
  errorMessage: string;
  artifactSession: WorldArtifactSession | null;
};

export const INITIAL_WORLD_WORKFLOW_STATE: WorldWorkflowState = {
  status: 'idle',
  errorMessage: '',
  artifactSession: null,
};

export type WorldWorkflowAction =
  | { type: 'BEGIN_VALIDATING' }
  | { type: 'BEGIN_GENERATING' }
  | { type: 'BEGIN_STRUCTURING' }
  | { type: 'BEGIN_REVIEWING' }
  | { type: 'SET_ARTIFACT_READY'; session: WorldArtifactSession }
  | { type: 'ENTER_APPROVAL' }
  | { type: 'APPROVE_ARTIFACT'; note?: string }
  | { type: 'ENTER_COMPLETED' }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'RESET' };

export function worldWorkflowReducer(state: WorldWorkflowState, action: WorldWorkflowAction): WorldWorkflowState {
  switch (action.type) {
    case 'BEGIN_VALIDATING':
      return { ...state, status: 'validating', errorMessage: '' };
    case 'BEGIN_GENERATING':
      return { ...state, status: 'generating', errorMessage: '' };
    case 'BEGIN_STRUCTURING':
      return { ...state, status: 'structuring', errorMessage: '' };
    case 'BEGIN_REVIEWING':
      return { ...state, status: 'reviewing', errorMessage: '' };
    case 'SET_ARTIFACT_READY':
      return {
        status: 'artifact_ready',
        errorMessage: '',
        artifactSession: action.session,
      };
    case 'ENTER_APPROVAL':
      return state.status === 'artifact_ready' && state.artifactSession?.validation.valid
        ? { ...state, status: 'approval', errorMessage: '' }
        : { ...state, status: 'error', errorMessage: 'Approval blocked: artifact is not ready.' };
    case 'APPROVE_ARTIFACT': {
      if (!state.artifactSession?.validation.valid) {
        return { ...state, status: 'error', errorMessage: 'Approval blocked: no valid artifact is available.' };
      }
      const updatedSession = approveArtifactSession(state.artifactSession, action.note);
      return {
        status: 'completed',
        errorMessage: '',
        artifactSession: updatedSession,
      };
    }
    case 'ENTER_COMPLETED':
      return state.status === 'artifact_ready' || state.status === 'approval'
        ? { ...state, status: 'completed', errorMessage: '' }
        : { ...state, status: 'error', errorMessage: 'Completion blocked: artifact is not ready.' };
    case 'SET_ERROR':
      return { ...state, status: 'error', errorMessage: action.message };
    case 'RESET':
      return INITIAL_WORLD_WORKFLOW_STATE;
    default:
      return state;
  }
}

export type ArtifactValidationResult = {
  valid: boolean;
  reasons: string[];
  exportEligible: boolean;
  renderablePrimitiveCount: number;
  previewCellCount: number;
};

export function buildCanonicalArtifact(payload: WorldGenerationOutput): WorldCanonicalArtifact {
  const sceneSpec = payload.worldArtifact.sceneSpec;
  const exportEligibility = getWorldExportEligibility(sceneSpec);
  const warnings = Array.from(new Set([...payload.worldArtifact.notes, ...sceneSpec.warnings]));

  return {
    worldId: sceneSpec.worldId,
    worldTitle: payload.worldArtifact.worldTitle,
    providerMode: payload.worldArtifact.providerMode,
    provider: payload.worldArtifact.provider,
    availability: payload.worldArtifact.availability,
    sceneSpec,
    preview: payload.worldArtifact.preview,
    primitiveCount: sceneSpec.primitives.length,
    meshConcept: payload.worldArtifact.assets.meshConcept,
    representation: payload.worldArtifact.assets.representation,
    sceneZones: payload.worldArtifact.assets.sceneZones,
    routeCorridors: payload.worldArtifact.assets.routeCorridors,
    exportReady: exportEligibility.eligible,
    simulationReady: payload.worldArtifact.assets.simulationReadiness === 'ready',
    policyReviewResult: payload.governance.policyValidation,
    approvalState: payload.status,
    approvalNotes: [],
    warnings,
    fallbackActive: payload.worldArtifact.availability === 'fallback',
  };
}

export function validateCanonicalArtifact(artifact: WorldCanonicalArtifact | null): ArtifactValidationResult {
  if (!artifact) {
    return {
      valid: false,
      reasons: ['artifact_missing'],
      exportEligible: false,
      renderablePrimitiveCount: 0,
      previewCellCount: 0,
    };
  }

  const reasons: string[] = [];
  const sceneSpec = artifact.sceneSpec;
  const preview = artifact.preview;
  const renderables = mapSceneSpecToRenderablePrimitives(sceneSpec);
  const renderablePrimitiveCount = renderables.length;
  const previewCellCount = preview?.cells?.length ?? 0;

  if (!sceneSpec?.worldId) reasons.push('scene_spec_missing');
  if (!sceneSpec?.primitives?.length) reasons.push('scene_primitives_missing');
  if (!renderablePrimitiveCount) reasons.push('renderable_scene_missing');
  if (!previewCellCount) reasons.push('preview_cells_missing');
  if (!artifact.sceneZones?.length) reasons.push('scene_zones_missing');
  if (!artifact.routeCorridors?.length) reasons.push('route_corridors_missing');

  const exportEligibility = sceneSpec ? getWorldExportEligibility(sceneSpec) : { eligible: false, reasons: ['scene_spec_missing'] };
  if (sceneSpec?.exportReadiness === 'ready' && !exportEligibility.eligible) {
    reasons.push('export_marked_ready_but_invalid');
  }

  return {
    valid: reasons.length === 0,
    reasons,
    exportEligible: exportEligibility.eligible,
    renderablePrimitiveCount,
    previewCellCount,
  };
}

export function buildArtifactSession(payload: WorldGenerationOutput): WorldArtifactSession {
  const artifact = buildCanonicalArtifact(payload);
  return {
    response: payload,
    artifact,
    validation: validateCanonicalArtifact(artifact),
  };
}

export function validateRenderableArtifact(payload: WorldGenerationOutput | null): ArtifactValidationResult {
  if (!payload?.worldArtifact) {
    return {
      valid: false,
      reasons: ['artifact_missing'],
      exportEligible: false,
      renderablePrimitiveCount: 0,
      previewCellCount: 0,
    };
  }
  return validateCanonicalArtifact(buildCanonicalArtifact(payload));
}

function approveArtifactSession(session: WorldArtifactSession, note?: string): WorldArtifactSession {
  const updatedWorkflow: WorldGenerationOutput['workflow'] = session.response.workflow.map((stage) => {
    if (stage.id === 'human-approval' || stage.id === 'final-world-output') {
      return { ...stage, state: 'completed' as const };
    }
    return stage;
  });

  const updatedTraces: WorldGenerationOutput['traces'] = session.response.traces.map((trace) => {
    if (trace.actor === 'Human Approval') {
      return {
        ...trace,
        status: 'completed' as const,
        summary: 'Human approver accepted world artifact for simulation-ready handoff.',
      };
    }
    return trace;
  });

  const approvalNotes = note?.trim()
    ? [...session.artifact.approvalNotes, note.trim()]
    : session.artifact.approvalNotes;

  const updatedResponse: WorldGenerationOutput = {
    ...session.response,
    status: 'completed',
    workflow: updatedWorkflow,
    traces: updatedTraces,
    finalRecommendation: session.response.finalRecommendation ?? session.response.proposedRecommendation,
    governance: {
      ...session.response.governance,
      evaluationStatus: 'pass',
    },
  };

  const updatedArtifact: WorldCanonicalArtifact = {
    ...session.artifact,
    approvalState: 'completed',
    approvalNotes,
  };

  return {
    response: updatedResponse,
    artifact: updatedArtifact,
    validation: validateCanonicalArtifact(updatedArtifact),
  };
}
