import { getWorldExportEligibility } from '@/lib/world-3d';
import type { WorldGenerationOutput } from '@/lib/world-generation';

export type WorldLifecycleState =
  | 'idle'
  | 'validating'
  | 'generating'
  | 'rendering'
  | 'ready'
  | 'approval'
  | 'completed'
  | 'error';

export type WorldWorkflowState = {
  lifecycle: WorldLifecycleState;
  errorMessage: string;
};

export const INITIAL_WORLD_WORKFLOW_STATE: WorldWorkflowState = {
  lifecycle: 'idle',
  errorMessage: '',
};

export type WorldWorkflowAction =
  | { type: 'VALIDATING' }
  | { type: 'GENERATING' }
  | { type: 'RENDERING' }
  | { type: 'ARTIFACT_READY' }
  | { type: 'ENTER_APPROVAL' }
  | { type: 'ENTER_COMPLETED' }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'RESET' };

export function worldWorkflowReducer(state: WorldWorkflowState, action: WorldWorkflowAction): WorldWorkflowState {
  switch (action.type) {
    case 'VALIDATING':
      return { lifecycle: 'validating', errorMessage: '' };
    case 'GENERATING':
      return { lifecycle: 'generating', errorMessage: '' };
    case 'RENDERING':
      return { lifecycle: 'rendering', errorMessage: '' };
    case 'ARTIFACT_READY':
      return { lifecycle: 'ready', errorMessage: '' };
    case 'ENTER_APPROVAL':
      return state.lifecycle === 'ready' ? { lifecycle: 'approval', errorMessage: '' } : { lifecycle: 'error', errorMessage: 'Approval blocked: artifact is not ready.' };
    case 'ENTER_COMPLETED':
      return state.lifecycle === 'ready' || state.lifecycle === 'approval'
        ? { lifecycle: 'completed', errorMessage: '' }
        : { lifecycle: 'error', errorMessage: 'Completion blocked: artifact is not ready.' };
    case 'SET_ERROR':
      return { lifecycle: 'error', errorMessage: action.message };
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
};

export function validateRenderableArtifact(payload: WorldGenerationOutput | null): ArtifactValidationResult {
  if (!payload?.worldArtifact) {
    return { valid: false, reasons: ['artifact_missing'], exportEligible: false };
  }

  const reasons: string[] = [];
  const sceneSpec = payload.worldArtifact.sceneSpec;
  const preview = payload.worldArtifact.preview;
  const assets = payload.worldArtifact.assets;

  if (!sceneSpec?.worldId) reasons.push('scene_spec_missing');
  if (!sceneSpec?.primitives?.length) reasons.push('scene_primitives_missing');
  if (!preview?.cells?.length) reasons.push('preview_cells_missing');
  if (!assets?.sceneZones?.length) reasons.push('scene_zones_missing');
  if (!assets?.routeCorridors?.length) reasons.push('route_corridors_missing');

  const exportEligibility = sceneSpec ? getWorldExportEligibility(sceneSpec) : { eligible: false, reasons: ['scene_spec_missing'] };
  if (sceneSpec?.exportReadiness === 'ready' && !exportEligibility.eligible) {
    reasons.push('export_marked_ready_but_invalid');
  }

  return {
    valid: reasons.length === 0,
    reasons,
    exportEligible: exportEligibility.eligible,
  };
}
