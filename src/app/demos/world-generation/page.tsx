'use client';

import { useEffect, useMemo, useReducer, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  Building2,
  CheckCircle2,
  ClipboardList,
  Cuboid,
  FileWarning,
  Flag,
  GitBranch,
  Loader2,
  Orbit,
  Shield,
  Sparkles,
  UserCheck,
  WandSparkles,
  Download,
  RotateCcw,
  Layers3,
  Info,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { validateRefinementInstruction } from '@/lib/guardrails';
import { applyRefinement } from '@/lib/spatial/refinement-engine';
import { generateDiff, formatDiffEntry } from '@/lib/spatial/scene-diff';
import { makeParametricScene } from '@/lib/spatial/scene-schema';
import type { ParametricScene, SceneDiff, RefinementEntry } from '@/lib/spatial/scene-schema';
import { ProceduralWorldCanvas } from '@/components/demos/world/ProceduralWorldCanvas';
import { WorldPreviewErrorBoundary } from '@/components/demos/world/WorldPreviewErrorBoundary';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DEFAULT_WORLD_CONSTRAINTS,
  WORLD_OBJECTIVE_OPTIONS,
  WORLD_PROMPT_TEMPLATES,
  WORLD_REGION_OPTIONS,
  WORLD_STYLE_OPTIONS,
  type WorldConstraintProfile,
  type WorldObjective,
  type WorldRegion,
  type WorldStyle,
} from '@/lib/world-prompts';
import {
  WORLD_UPLOAD_LIMITS,
  validateWorldUploadPayload,
  type WorldUploadPayload,
} from '@/lib/world-guardrails';
import type { WorldEvalResult } from '@/lib/world-eval';
import type { WorldGenerationOutput, WorldWorkflowStage } from '@/lib/world-generation';
import {
  exportWorldSceneAsGlb,
  getWorldExportEligibility,
  getWorldSceneComplexity,
} from '@/lib/world-3d';
import {
  type WorldArtifactSession,
  type WorldCanonicalArtifact,
  buildArtifactSession,
  INITIAL_WORLD_WORKFLOW_STATE,
  validateRenderableArtifact,
  worldWorkflowReducer,
} from '@/lib/world-workflow-state';
import {
  type ApprovalStatus,
  type ScenarioVariantId,
  approvalStatusLabel,
  buildScenarioComparisonSummary,
  buildScenarioVariants,
  deriveApprovalStatus,
  transitionApprovalStatus,
} from '@/lib/world-product-upgrades';
import { createSpatialTrace, type SpatialTraceContext } from '@/lib/observability';


type WorldApiResponse = WorldGenerationOutput & {
  evaluation: WorldEvalResult;
};

const WORLD_DEBUG = process.env.NODE_ENV !== 'production';

type SpatialPipelineStage = {
  id: WorldWorkflowStage['id'] | 'hitl-checkpoint';
  label: string;
  description: string;
  state: WorldWorkflowStage['state'];
};

const LINGBOT_SEEDED_RUN: SpatialPipelineStage[] = [
  {
    id: 'prompt-intake',
    label: 'Perception Layer Input',
    description: 'LiDAR + camera feed ingested at 20 FPS. Spatial parameters parsed: zone=downtown, density=high, policy=safety-first.',
    state: 'completed',
  },
  {
    id: 'scene-intent',
    label: 'Scene Reconstruction',
    description: 'Occupancy grid assembled in 2.7s. Depth map fused across 4 sensor arrays. Mesh surface deviation < 3cm.',
    state: 'completed',
  },
  {
    id: 'world-generation',
    label: 'World Model Assembly',
    description: '847 scene objects placed. 12 route corridors defined. Drift correction applied — 74% reduction in mesh displacement.',
    state: 'completed',
  },
  {
    id: 'policy-review',
    label: 'Agent Spatial Reasoning',
    description: '4 spatial agents active. LLM spatial query resolved in 623ms: "Identify congestion pinch points in zone B-3."',
    state: 'completed',
  },
  {
    id: 'hitl-checkpoint',
    label: 'Human-in-the-Loop Review',
    description: 'Spatial agent recommendation reviewed. Path Corridor C approved by human operator. Confidence: 94%. Override available.',
    state: 'completed',
  },
  {
    id: 'human-approval',
    label: 'Governance Check',
    description: 'Policy constraints applied. Accessibility: compliant. 4 safety exclusion zones enforced. HITL checkpoint passed.',
    state: 'completed',
  },
  {
    id: 'final-world-output',
    label: 'Export Ready',
    description: 'GLB export ready. Simulation metadata attached. Trace ID: sp-lingbot-seed-001. Audit trail complete.',
    state: 'completed',
  },
];

function logWorldDebug(event: string, details: Record<string, unknown>) {
  if (!WORLD_DEBUG) return;
  console.info(`[world-generation-debug] ${event}`, details);
}

function getPreviewGenerationLabel(artifact: WorldCanonicalArtifact): string {
  if (artifact.availability === 'fallback') return 'Procedural 3D (Fallback Active)';
  if (artifact.providerMode === 'hyworld-adapter') return 'Model-assisted preview active';
  return 'Procedural 3D (Deterministic Mock)';
}

const STAGE_ICONS: Record<WorldWorkflowStage['id'], typeof Orbit> = {
  'prompt-intake': ClipboardList,
  'scene-intent': Sparkles,
  'world-generation': Cuboid,
  'asset-structuring': Box,
  'policy-review': Shield,
  'human-approval': UserCheck,
  'final-world-output': CheckCircle2,
};

const STAGE_STYLE: Record<WorldWorkflowStage['state'], string> = {
  idle: 'border-border bg-muted/30 text-muted-foreground',
  running: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  completed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  paused: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  failed: 'border-red-500/40 bg-red-500/10 text-red-300',
};

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Image could not be decoded'));
      image.src = objectUrl;
    });
    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function WorldGenerationPage() {
  const [prompt, setPrompt] = useState(WORLD_PROMPT_TEMPLATES[0]);
  const [region, setRegion] = useState<WorldRegion>(WORLD_REGION_OPTIONS[0]);
  const [objective, setObjective] = useState<WorldObjective>('speed');
  const [style, setStyle] = useState<WorldStyle>('logistics-grid');
  const [provider, setProvider] = useState<'mock' | 'hyworld'>('hyworld');
  const [simulationReady, setSimulationReady] = useState(true);
  const [constraints, setConstraints] = useState<WorldConstraintProfile>(DEFAULT_WORLD_CONSTRAINTS);
  const [revisionNote, setRevisionNote] = useState('');
  const [uploadMetadata, setUploadMetadata] = useState<WorldUploadPayload | undefined>(undefined);
  const [uploadError, setUploadError] = useState('');
  const [showOverlays, setShowOverlays] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('awaiting');
  const [approvalContextMessage, setApprovalContextMessage] = useState('');
  const [activeScenarioVariant, setActiveScenarioVariant] = useState<ScenarioVariantId>('baseline');
  const [revisionBaselineSession, setRevisionBaselineSession] = useState<WorldArtifactSession | null>(null);
  const [exportState, setExportState] = useState<'ready' | 'exporting' | 'failed'>('ready');
  const [exportMessage, setExportMessage] = useState('');
  const [workflowState, dispatchWorkflow] = useReducer(worldWorkflowReducer, INITIAL_WORLD_WORKFLOW_STATE);
  const spatialTraceRef = useRef<SpatialTraceContext | null>(null);
  const [spatialTraceId, setSpatialTraceId] = useState<string | null>(null);
  const [hitlDecision, setHitlDecision] = useState<'awaiting_approval' | 'approved' | 'rejected'>('awaiting_approval');
  const [parametricScene, setParametricScene] = useState<ParametricScene | null>(null);
  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [refinementLoading, setRefinementLoading] = useState(false);
  const [refinementError, setRefinementError] = useState('');
  const [diffBatches, setDiffBatches] = useState<Array<{ version: number; diffs: SceneDiff[] }>>([]);
  const [showAllDiffs, setShowAllDiffs] = useState(false);
  const artifactSession = workflowState.artifactSession;
  const result = (artifactSession?.response as WorldApiResponse | undefined) ?? null;
  const canonicalArtifact = artifactSession?.artifact ?? null;
  const artifactReadiness = artifactSession?.validation ?? validateRenderableArtifact(null);

  const desktopSignal = useMemo(() => {
    return 'Desktop-friendly: world preview rendering is optimized for larger displays; mobile uses a lighter fallback view.';
  }, []);

  useEffect(() => {
    logWorldDebug('workflow.transition', {
      status: workflowState.status,
      hasArtifactSession: Boolean(artifactSession),
      worldId: canonicalArtifact?.worldId ?? null,
      hasSceneSpec: Boolean(canonicalArtifact?.sceneSpec),
      primitiveCount: canonicalArtifact?.primitiveCount ?? 0,
      previewCells: canonicalArtifact?.preview.cells.length ?? 0,
      exportReady: canonicalArtifact?.exportReady ?? false,
      renderablePrimitiveCount: artifactReadiness.renderablePrimitiveCount,
    });
  }, [artifactReadiness.renderablePrimitiveCount, artifactSession, canonicalArtifact, workflowState.status]);

  useEffect(() => {
    if (!artifactSession) return;
    logWorldDebug('artifact.transition', {
      status: workflowState.status,
      worldId: artifactSession.artifact.worldId,
      previewCells: artifactSession.validation.previewCellCount,
      renderablePrimitiveCount: artifactSession.validation.renderablePrimitiveCount,
      exportReady: artifactSession.artifact.exportReady,
      approvalState: artifactSession.artifact.approvalState,
    });
  }, [artifactSession, workflowState.status]);

  // Initialize parametric scene when generation produces a valid artifact
  useEffect(() => {
    if (!canonicalArtifact || !result) return;
    setParametricScene(makeParametricScene({
      sourcePrompt: prompt,
      region,
      objective,
      objects: [],
    }));
    setDiffBatches([]);
    setRefinementError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonicalArtifact?.worldId]);

  const handleRefineScene = () => {
    if (!parametricScene || !refinementInstruction.trim()) return;
    const guard = validateRefinementInstruction(refinementInstruction);
    if (!guard.safe) {
      setRefinementError(`Instruction blocked: ${guard.reason ?? 'guardrail violation'}`);
      return;
    }
    setRefinementLoading(true);
    setRefinementError('');
    try {
      const before = parametricScene;
      const result = applyRefinement(before, refinementInstruction);
      if (!result.success || !result.scene) {
        setRefinementError(
          `Could not apply — try rephrasing. ${result.fallbackSuggestions ? 'Suggestions: ' + result.fallbackSuggestions.slice(0, 2).join(', ') : ''}`
        );
        return;
      }
      const diffs = generateDiff(before, result.scene);
      const entry: RefinementEntry = {
        instruction: refinementInstruction,
        diff: diffs,
        appliedAt: new Date().toISOString(),
        engine: 'deterministic',
      };
      const next: ParametricScene = {
        ...result.scene,
        refinementHistory: [...before.refinementHistory, entry],
      };
      setParametricScene(next);
      setDiffBatches((prev) => [...prev, { version: next.version, diffs }]);
      setRefinementInstruction('');
    } finally {
      setRefinementLoading(false);
    }
  };

  const handleExportSceneJson = () => {
    if (!parametricScene) return;
    const blob = new Blob([JSON.stringify(parametricScene, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene-${parametricScene.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runGeneration = async () => {
    const trace = createSpatialTrace();
    trace.addSpan('generation-start');
    spatialTraceRef.current = trace;
    setSpatialTraceId(trace.traceId);
    setHitlDecision('awaiting_approval');
    dispatchWorkflow({ type: 'BEGIN_VALIDATING' });
    dispatchWorkflow({ type: 'BEGIN_GENERATING' });
    setExportState('ready');
    setExportMessage('');

    try {
      const response = await fetch('/api/demos/world-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          region,
          objective,
          style,
          provider,
          simulationReady,
          constraints,
          image: uploadMetadata,
          approvalState: 'pending',
        }),
      });

      const payload = (await response.json()) as WorldApiResponse & {
        error?: string;
        details?: string[];
      };

      if (!response.ok) {
        const details = payload.details?.length ? ` (${payload.details.join(', ')})` : '';
        dispatchWorkflow({ type: 'SET_ERROR', message: `${payload.error ?? 'Unable to generate world'}${details}` });
        return;
      }

      dispatchWorkflow({ type: 'BEGIN_STRUCTURING' });
      dispatchWorkflow({ type: 'BEGIN_REVIEWING' });
      const session = buildArtifactSession(payload);
      const artifactCheck = session.validation;
      logWorldDebug('artifact.received', {
        status: payload.status,
        hasWorldArtifact: Boolean(payload.worldArtifact),
        hasSceneSpec: Boolean(payload.worldArtifact?.sceneSpec),
        primitiveCount: session.artifact.primitiveCount,
        renderablePrimitiveCount: artifactCheck.renderablePrimitiveCount,
        previewCells: artifactCheck.previewCellCount,
        exportReady: artifactCheck.exportEligible,
      });
      if (!artifactCheck.valid) {
        dispatchWorkflow({
          type: 'SET_ERROR',
          message: `World artifact failed readiness checks: ${artifactCheck.reasons.join(', ')}`,
        });
        return;
      }

      dispatchWorkflow({ type: 'SET_ARTIFACT_READY', session });
      if (payload.status === 'pending_review') {
        dispatchWorkflow({ type: 'ENTER_APPROVAL' });
      } else {
        dispatchWorkflow({ type: 'ENTER_COMPLETED' });
      }
      setApprovalStatus(
        deriveApprovalStatus({
          requiresHumanApproval: payload.governance.humanApprovalRequired,
          workflowStatus: payload.status === 'pending_review' ? 'approval' : 'completed',
          outputStatus: payload.status,
        })
      );
      setApprovalContextMessage(
        payload.governance.humanApprovalRequired
          ? 'Human review required before releasing this simulation-ready artifact.'
          : 'Auto-approved (low risk scenario).'
      );
      setActiveScenarioVariant('baseline');
    } catch {
      dispatchWorkflow({ type: 'SET_ERROR', message: 'World generation request failed. Please retry in a moment.' });
    }
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError('');

    if (!file) {
      setUploadMetadata(undefined);
      return;
    }

    try {
      const { width, height } = await readImageDimensions(file);
      const candidate: WorldUploadPayload = {
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        width,
        height,
      };

      const validation = validateWorldUploadPayload(candidate);
      if (!validation.isValid) {
        setUploadMetadata(undefined);
        setUploadError(`Upload rejected: ${validation.errors.join(', ')}`);
        return;
      }

      setUploadMetadata(candidate);
    } catch {
      setUploadMetadata(undefined);
      setUploadError('Upload rejected: image could not be decoded safely.');
    }
  };

  const handleApprove = () => {
    if (workflowState.status !== 'approval' || !artifactSession?.validation.valid) {
      dispatchWorkflow({ type: 'SET_ERROR', message: 'Approval blocked until a valid world artifact is visible.' });
      return;
    }
    dispatchWorkflow({ type: 'APPROVE_ARTIFACT', note: revisionNote });
    setApprovalStatus((current) => transitionApprovalStatus(current, 'approve'));
    setApprovalContextMessage('Approved for downstream planning decisions.');
    setRevisionNote('');
  };

  const handleRevise = () => {
    if (artifactSession && !revisionBaselineSession) {
      setRevisionBaselineSession(artifactSession);
    }
    setApprovalStatus((current) => transitionApprovalStatus(current, 'revise'));
    setApprovalContextMessage('Revision requested. Current artifact retained for comparison while preparing a new run.');
  };

  const handleCancel = () => {
    setApprovalStatus((current) => transitionApprovalStatus(current, 'cancel'));
    setApprovalContextMessage('Approval canceled. Artifact is preserved for review but not finalized.');
  };

  const workflow = result?.workflow ?? [];
  const traces = result?.traces ?? [];

  const sceneSpec = canonicalArtifact?.sceneSpec;
  const sceneComplexity = sceneSpec ? getWorldSceneComplexity(sceneSpec) : null;
  const exportEligibility = sceneSpec && artifactReadiness.valid ? getWorldExportEligibility(sceneSpec) : null;
  const previewGenerationLabel = canonicalArtifact ? getPreviewGenerationLabel(canonicalArtifact) : null;
  const approvalStatusText = result ? approvalStatusLabel(approvalStatus) : null;
  const scenarioVariants = useMemo(() => {
    if (!canonicalArtifact || !result) return [];
    return buildScenarioVariants({
      artifact: canonicalArtifact,
      recommendation: result.proposedRecommendation,
    });
  }, [canonicalArtifact, result]);
  const selectedScenario = scenarioVariants.find((variant) => variant.id === activeScenarioVariant) ?? scenarioVariants[0];
  const revisionDelta = useMemo(() => {
    if (!revisionBaselineSession || !canonicalArtifact) return null;
    if (revisionBaselineSession.artifact.worldId === canonicalArtifact.worldId) return null;
    return {
      primitiveDelta: canonicalArtifact.primitiveCount - revisionBaselineSession.artifact.primitiveCount,
      corridorDelta: canonicalArtifact.routeCorridors.length - revisionBaselineSession.artifact.routeCorridors.length,
      zoneDelta: canonicalArtifact.sceneZones.length - revisionBaselineSession.artifact.sceneZones.length,
    };
  }, [canonicalArtifact, revisionBaselineSession]);

  useEffect(() => {
    if (!isPreviewExpanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPreviewExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPreviewExpanded]);

  const handleHITLDecision = (decision: 'approved' | 'rejected') => {
    spatialTraceRef.current?.addSpan('hitl_checkpoint');
    setHitlDecision(decision);
  };

  const displayedStages = useMemo<SpatialPipelineStage[]>(() => {
    if (workflow.length) return workflow as SpatialPipelineStage[];
    const hitlIdx = LINGBOT_SEEDED_RUN.findIndex((s) => s.id === 'hitl-checkpoint');
    const hitlPending = hitlDecision === 'awaiting_approval';
    return LINGBOT_SEEDED_RUN.map((stage, idx) => {
      if (stage.id === 'hitl-checkpoint') {
        return {
          ...stage,
          state: hitlDecision === 'approved' ? 'completed' as const
               : hitlDecision === 'rejected' ? 'failed' as const
               : 'paused' as const,
        };
      }
      if ((hitlPending || hitlDecision === 'rejected') && idx > hitlIdx) {
        return { ...stage, state: 'idle' as const };
      }
      return stage;
    });
  }, [workflow, hitlDecision]);

  const handleExportGlb = async () => {
    if (!sceneSpec || !artifactReadiness.valid) return;
    setExportState('exporting');
    setExportMessage('');
    try {
      const exportResult = await exportWorldSceneAsGlb(sceneSpec);
      setExportState('ready');
      setExportMessage(`Scene exported: ${exportResult.fileName}`);
    } catch (error) {
      setExportState('failed');
      const message = error instanceof Error ? error.message : '';
      setExportMessage(message ? `Export failed — please retry (${message})` : 'Export failed — please retry');
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'Real-Time Spatial AI + World Modeling Engine',
    description: 'Perception → reconstruction → agent reasoning. Precomputed 3D mesh playback with drift correction visualization and LLM spatial query layer. Controllable parametric spatial design — refine generated scenes with natural-language instructions.',
    keywords: 'World Generation, Spatial AI, Three.js, GLB Export, Governance, Simulation-Ready, World Model, Perception, Parametric Refinement',
    url: 'https://www.prasadkavuri.com/demos/world-generation',
    author: { '@type': 'Person', '@id': 'https://www.prasadkavuri.com/#person', name: 'Prasad Kavuri', url: 'https://www.prasadkavuri.com', sameAs: ['https://www.linkedin.com/in/pkavuri/', 'https://github.com/prasad-kavuri'] },
    about: { '@type': 'Thing', name: 'AI Engineering' },
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <ThemeToggle />
          <Link href="/" className="text-muted-foreground hover:text-foreground" aria-label="Back to portfolio">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Real-Time Spatial AI + World Modeling Engine</h1>
            <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--accent-brand)' }}>
              Controllable Spatial AI — Parametric Scene Refinement
            </p>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Perception → reconstruction → agent reasoning. Precomputed 3D mesh playback with drift correction visualization and LLM spatial query layer.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="outline">World Generation</Badge>
          <Badge variant="outline">Spatial AI</Badge>
          <Badge variant="outline">Governed Output</Badge>
          <Badge variant="outline">Explainable Pipeline</Badge>
          <Badge variant="outline">Parametric Refinement</Badge>
          <Badge variant="outline">Instruction-Led Editing</Badge>
          <Badge variant="outline">Desktop-Friendly</Badge>
        </div>

        <Card className="mb-6 border-border bg-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{desktopSignal}</p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>World Prompt Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="prompt-template">Example prompts</label>
                  <select
                    id="prompt-template"
                    className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                  >
                    {WORLD_PROMPT_TEMPLATES.map((template) => (
                      <option key={template} value={template}>{template}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="world-prompt">Text-to-world prompt</label>
                  <textarea
                    id="world-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    className="h-28 w-full rounded-md border border-border bg-background p-2 text-sm"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="region">Region</label>
                    <select
                      id="region"
                      value={region}
                      onChange={(event) => setRegion(event.target.value as WorldRegion)}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      {WORLD_REGION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="objective">Objective</label>
                    <select
                      id="objective"
                      value={objective}
                      onChange={(event) => setObjective(event.target.value as WorldObjective)}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      {WORLD_OBJECTIVE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="world-style">World style</label>
                    <select
                      id="world-style"
                      value={style}
                      onChange={(event) => setStyle(event.target.value as WorldStyle)}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      {WORLD_STYLE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="provider">Provider mode</label>
                    <select
                      id="provider"
                      value={provider}
                      onChange={(event) => setProvider(event.target.value as 'mock' | 'hyworld')}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      <option value="hyworld">HY-World Adapter (fallback-aware)</option>
                      <option value="mock">Mock Provider (deterministic)</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="budget-level">Budget profile</label>
                    <select
                      id="budget-level"
                      value={constraints.budgetLevel}
                      onChange={(event) => setConstraints((prev) => ({ ...prev, budgetLevel: event.target.value as WorldConstraintProfile['budgetLevel'] }))}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="congestion-sensitivity">Congestion sensitivity</label>
                    <select
                      id="congestion-sensitivity"
                      value={constraints.congestionSensitivity}
                      onChange={(event) => setConstraints((prev) => ({ ...prev, congestionSensitivity: event.target.value as WorldConstraintProfile['congestionSensitivity'] }))}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="policy-profile">Policy profile</label>
                    <select
                      id="policy-profile"
                      value={constraints.policyProfile}
                      onChange={(event) => setConstraints((prev) => ({ ...prev, policyProfile: event.target.value as WorldConstraintProfile['policyProfile'] }))}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      <option value="balanced">Balanced</option>
                      <option value="safety-first">Safety-first</option>
                      <option value="throughput-first">Throughput-first</option>
                    </select>
                  </div>
                  <label className="mt-5 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={constraints.accessibilityPriority}
                      onChange={(event) => setConstraints((prev) => ({ ...prev, accessibilityPriority: event.target.checked }))}
                    />
                    Accessibility priority
                  </label>
                  <label className="mt-5 flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={simulationReady}
                      onChange={(event) => setSimulationReady(event.target.checked)}
                    />
                    Mark output as simulation-ready candidate
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="scene-upload">
                    Optional image reference
                  </label>
                  <input
                    id="scene-upload"
                    type="file"
                    accept={WORLD_UPLOAD_LIMITS.allowedMimeTypes.join(',')}
                    onChange={handleFileSelection}
                    className="w-full text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports PNG, JPEG, WebP. Max {Math.round(WORLD_UPLOAD_LIMITS.maxBytes / (1024 * 1024))}MB and {WORLD_UPLOAD_LIMITS.maxDimension}px per side.
                  </p>
                  {uploadMetadata && (
                    <p className="mt-2 text-xs text-emerald-400">
                      Uploaded: {uploadMetadata.name} ({uploadMetadata.width}x{uploadMetadata.height})
                    </p>
                  )}
                  {uploadError && <p className="mt-2 text-xs text-red-400">{uploadError}</p>}
                </div>

                <Button
                  onClick={runGeneration}
                  disabled={
                    workflowState.status === 'validating' ||
                    workflowState.status === 'generating' ||
                    workflowState.status === 'structuring' ||
                    workflowState.status === 'reviewing'
                  }
                >
                  {workflowState.status === 'validating' ||
                  workflowState.status === 'generating' ||
                  workflowState.status === 'structuring' ||
                  workflowState.status === 'reviewing' ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" />Generating world...</>
                  ) : (
                    <><WandSparkles className="mr-2 size-4" />Generate governed world</>
                  )}
                </Button>
                {workflowState.errorMessage && <p className="text-sm text-red-400">{workflowState.errorMessage}</p>}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Generation Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {displayedStages.map((stage) => {
                  // HITL checkpoint — interactive approval card when awaiting
                  if (stage.id === 'hitl-checkpoint') {
                    if (hitlDecision === 'awaiting_approval') {
                      return (
                        <div key="hitl-checkpoint" className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 my-1">
                          <div className="flex items-center gap-2 mb-2">
                            <UserCheck className="size-4 text-amber-400" />
                            <p className="text-sm font-semibold text-amber-400">⏸ Human Review Required</p>
                            {spatialTraceId && (
                              <code className="ml-auto text-[10px] font-mono text-muted-foreground">
                                {spatialTraceId.slice(0, 8)}
                              </code>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Agent recommends <strong className="text-foreground">Path Corridor C</strong> for last-mile routing.
                            Review the spatial reasoning before authorizing export.
                          </p>
                          <div className="text-xs text-muted-foreground mb-3 font-mono bg-muted/30 px-3 py-2 rounded">
                            Agent confidence: 94% · Obstacles cleared: 7 · Drift score: 0.12
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleHITLDecision('approved')}>
                              ✓ Approve &amp; Continue
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleHITLDecision('rejected')}>
                              ✗ Reject &amp; Re-route
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    // Approved or rejected — render as standard stage row
                    return (
                      <div key="hitl-checkpoint" className={`rounded-lg border p-3 ${STAGE_STYLE[stage.state]}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <UserCheck className="size-4" />
                            <p className="text-sm font-medium">{stage.label}</p>
                          </div>
                          <Badge variant="outline">{stage.state}</Badge>
                        </div>
                        <p className="mt-1 text-xs">{stage.description}</p>
                      </div>
                    );
                  }
                  // Standard stages — stage.id is narrowed to WorldWorkflowStage['id'] here
                  const Icon = STAGE_ICONS[stage.id];
                  return (
                    <div key={stage.id} className={`rounded-lg border p-3 ${STAGE_STYLE[stage.state]}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <p className="text-sm font-medium">{stage.label}</p>
                        </div>
                        <Badge variant="outline">{stage.state}</Badge>
                      </div>
                      <p className="mt-1 text-xs">{stage.description}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {result && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear &amp; try your own →
                </button>
              </div>
            )}

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Execution Trace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {traces.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Run generation to produce a traceable world-generation pipeline.</p>
                ) : (
                  traces.map((trace) => (
                    <div key={`${trace.sequence}-${trace.actor}`} className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{trace.sequence}. {trace.actor}</p>
                        <Badge variant={trace.status === 'paused' ? 'secondary' : 'default'}>{trace.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{trace.action}</p>
                      <p className="mt-2 text-sm">{trace.summary}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Perception Layer stat bar — static values from LINGBOT_SEEDED_RUN */}
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold">
                20 FPS Reconstruction
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
                74% Drift Reduction
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm font-semibold">
                4 Spatial Agents Active
              </span>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Generated World Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!canonicalArtifact && workflowState.status === 'idle' && (
                  <p className="text-sm text-muted-foreground">Generate a world to render the procedural 3D scene preview and export-readiness summary.</p>
                )}
                {!canonicalArtifact &&
                  (workflowState.status === 'validating' ||
                    workflowState.status === 'generating' ||
                    workflowState.status === 'structuring' ||
                    workflowState.status === 'reviewing') && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Preparing world artifact preview...
                  </div>
                )}
                {!canonicalArtifact && workflowState.status === 'error' && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
                    World generation failed before a renderable artifact was available. Revise inputs and retry.
                  </div>
                )}
                {canonicalArtifact && !artifactReadiness.valid && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
                    Generated output is incomplete for preview/approval: {artifactReadiness.reasons.join(', ')}
                  </div>
                )}

                {canonicalArtifact && sceneSpec && artifactReadiness.valid && (
                  <>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{canonicalArtifact.worldTitle}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{canonicalArtifact.providerMode}</Badge>
                          <Badge variant="outline">{canonicalArtifact.availability}</Badge>
                          <Badge variant="outline">{sceneSpec.exportReadiness === 'ready' ? 'Export Ready' : 'Export Review'}</Badge>
                        </div>
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {previewGenerationLabel && (
                          <Badge variant="secondary" data-testid="preview-generation-label">
                            {previewGenerationLabel}
                          </Badge>
                        )}
                        {approvalStatusText && (
                          <Badge variant="outline" data-testid="approval-status-label">
                            <Info className="mr-1 size-3" /> {approvalStatusText}
                          </Badge>
                        )}
                      </div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Procedural 3D World Artifact
                      </p>

                      {!isPreviewExpanded ? (
                        <div className="mb-3 rounded-lg border border-border bg-background/50 p-2">
                          <WorldPreviewErrorBoundary worldId={canonicalArtifact.worldId}>
                            <ProceduralWorldCanvas sceneSpec={sceneSpec} resetToken={resetToken} showOverlays={showOverlays} />
                          </WorldPreviewErrorBoundary>
                        </div>
                      ) : (
                        <div className="mb-3 rounded-lg border border-border bg-background/30 p-4 text-sm text-muted-foreground">
                          Preview is currently expanded.
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setResetToken((value) => value + 1)}
                          className="gap-2"
                        >
                          <RotateCcw className="size-4" /> Reset View
                        </Button>
                        <Button
                          type="button"
                          variant={showOverlays ? 'default' : 'outline'}
                          onClick={() => setShowOverlays((value) => !value)}
                          className="gap-2"
                        >
                          <Layers3 className="size-4" /> {showOverlays ? 'Hide Overlays' : 'Show Overlays'}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleExportGlb}
                          className="gap-2"
                          disabled={exportState === 'exporting' || !exportEligibility?.eligible}
                          data-testid="export-glb-button"
                        >
                          {exportState === 'exporting' ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Download className="size-4" />
                          )}
                          Export GLB
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsPreviewExpanded(true)}
                          className="gap-2"
                          data-testid="expand-preview-button"
                        >
                          <Maximize2 className="size-4" /> Expand Preview
                        </Button>
                        {parametricScene && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleExportSceneJson}
                            className="gap-2"
                            data-testid="export-scene-json-button"
                          >
                            <Download className="size-4" /> Export Scene JSON
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mesh concept</p>
                        <p className="mt-1 text-sm">{canonicalArtifact.meshConcept}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Representation</p>
                        <p className="mt-1 text-sm">{canonicalArtifact.representation}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scene complexity</p>
                        <p className="mt-1 text-sm">
                          {sceneComplexity?.primitiveCount} / {sceneComplexity?.budget} primitives
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scene zones</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                          {canonicalArtifact.sceneZones.map((zone) => <li key={zone}>{zone}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Route corridors</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                          {canonicalArtifact.routeCorridors.map((corridor) => <li key={corridor}>{corridor}</li>)}
                        </ul>
                      </div>
                    </div>

                    <p className="text-sm">
                      <span className="font-medium">Simulation readiness:</span>{' '}
                      {canonicalArtifact.simulationReady ? 'ready' : 'review'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Export status:</span>{' '}
                      {exportEligibility?.eligible ? 'ready' : `review (${exportEligibility?.reasons.join(', ')})`}
                    </p>
                    {exportMessage && (
                      <p
                        className={`text-sm ${exportState === 'failed' ? 'text-red-400' : 'text-emerald-400'}`}
                        data-testid="export-feedback"
                      >
                        {exportState === 'failed' ? (
                          exportMessage
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 inline size-4" />
                            {exportMessage}
                          </>
                        )}
                      </p>
                    )}

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Provider notes</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                        {canonicalArtifact.warnings.map((note) => <li key={note}>{note}</li>)}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {selectedScenario && canonicalArtifact && result && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Scenario Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {scenarioVariants.map((variant) => (
                      <Button
                        key={variant.id}
                        type="button"
                        size="sm"
                        variant={activeScenarioVariant === variant.id ? 'default' : 'outline'}
                        onClick={() => setActiveScenarioVariant(variant.id)}
                        data-testid={`scenario-${variant.id}`}
                      >
                        {variant.label}
                      </Button>
                    ))}
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                    <p className="font-medium">{selectedScenario.label}</p>
                    <p className="mt-1 text-muted-foreground">{buildScenarioComparisonSummary(selectedScenario)}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objective</p>
                      <p className="mt-1">{selectedScenario.objective}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Complexity</p>
                      <p className="mt-1">{selectedScenario.complexity}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Route corridor differences</p>
                      <p className="mt-1">{selectedScenario.routeDifference}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zone differences</p>
                      <p className="mt-1">{selectedScenario.zoneDifference}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Policy / safety notes</p>
                      <p className="mt-1">{selectedScenario.policyNote}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Business impact</p>
                      <p className="mt-1">{selectedScenario.businessImpact}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommendation tradeoff</p>
                    <p className="mt-1">{selectedScenario.tradeoff}</p>
                    <p className="mt-2 text-muted-foreground">{selectedScenario.recommendation}</p>
                  </div>

                  {revisionDelta && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                      <p className="font-medium">Revision Delta vs Previous Artifact</p>
                      <p className="mt-1">
                        Primitive delta: {revisionDelta.primitiveDelta >= 0 ? '+' : ''}
                        {revisionDelta.primitiveDelta}, corridor delta: {revisionDelta.corridorDelta >= 0 ? '+' : ''}
                        {revisionDelta.corridorDelta}, zone delta: {revisionDelta.zoneDelta >= 0 ? '+' : ''}
                        {revisionDelta.zoneDelta}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Final World Output</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!result && (
                  <p className="text-sm text-muted-foreground">Final governed world output appears after generation completes.</p>
                )}

                {result && (
                  <>
                    <p className="text-sm font-semibold">{result.proposedRecommendation.headline}</p>
                    <p className="text-sm text-muted-foreground">{result.proposedRecommendation.rationale}</p>
                    <p className="text-sm"><span className="font-medium">Business impact:</span> {result.proposedRecommendation.businessImpact}</p>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tradeoffs</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                        {result.proposedRecommendation.tradeoffs.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Constraints applied</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                        {result.proposedRecommendation.constraintsApplied.map((constraint) => <li key={constraint}>{constraint}</li>)}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── Refinement Panel — only after generation ── */}
            {parametricScene && canonicalArtifact && artifactReadiness.valid && (
              <Card className="border-border bg-card" data-testid="refinement-panel">
                <CardHeader>
                  <CardTitle>Refine this scene</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <textarea
                      value={refinementInstruction}
                      onChange={(e) => setRefinementInstruction(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefineScene(); } }}
                      placeholder="e.g. Make the loading bay 20% wider"
                      className="h-20 w-full rounded-md border border-border bg-background p-2 text-sm"
                      data-testid="refinement-input"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Using deterministic spatial engine
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleRefineScene}
                    disabled={refinementLoading || !refinementInstruction.trim()}
                    data-testid="apply-refinement-button"
                  >
                    {refinementLoading ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" />Applying...</>
                    ) : (
                      'Apply refinement'
                    )}
                  </Button>
                  {refinementError && (
                    <p className="text-sm text-amber-400" data-testid="refinement-error">{refinementError}</p>
                  )}
                  {parametricScene.version > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Scene version: {parametricScene.version} · {parametricScene.refinementHistory.length} refinement(s) applied
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Diff Panel — only after at least one refinement ── */}
            {diffBatches.length > 0 && (
              <Card className="border-border bg-card" data-testid="diff-panel">
                <CardHeader>
                  <CardTitle>What changed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {diffBatches.map((batch) => {
                    const allItems = batch.diffs;
                    const visible = showAllDiffs ? allItems : allItems.slice(0, 8);
                    return (
                      <div key={batch.version}>
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">
                          [version {batch.version - 1} → {batch.version}]
                        </p>
                        <ul className="space-y-1">
                          {visible.map((diff, i) => (
                            <li
                              key={`${diff.objectId}-${diff.property ?? 'obj'}-${i}`}
                              className={`text-xs font-mono ${
                                diff.type === 'added' ? 'text-emerald-400'
                                : diff.type === 'removed' ? 'text-red-400'
                                : 'text-amber-400'
                              }`}
                            >
                              {formatDiffEntry(diff)}
                            </li>
                          ))}
                        </ul>
                        {allItems.length > 8 && !showAllDiffs && (
                          <button
                            type="button"
                            onClick={() => setShowAllDiffs(true)}
                            className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            show all {allItems.length} changes →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {(workflowState.status === 'approval' || approvalStatus !== 'awaiting') && canonicalArtifact && artifactReadiness.valid && result && (
              <Card className="border-amber-500/40 bg-amber-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-200">
                    <UserCheck className="size-4" /> Human Approval Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-amber-100">
                    Approval required because this simulation-ready artifact could influence downstream planning decisions.
                  </p>
                  <p className="text-sm text-amber-100">
                    {approvalContextMessage || 'This output is intended for downstream planning and should be approved before use.'}
                  </p>
                  <p className="text-sm text-amber-100">Next action: {result.proposedRecommendation.nextAction}</p>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-amber-200" htmlFor="revision-note">
                    Revision note
                  </label>
                  <textarea
                    id="revision-note"
                    value={revisionNote}
                    onChange={(event) => setRevisionNote(event.target.value)}
                    className="h-20 w-full rounded-md border border-amber-500/40 bg-background/80 p-2 text-sm text-foreground"
                    placeholder="Optional: add reviewer feedback before revise."
                  />
                  {approvalStatus !== 'auto_approved' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleApprove} data-testid="approval-approve-button">Approve</Button>
                      <Button variant="secondary" onClick={handleRevise} data-testid="approval-revise-button">Request Revision</Button>
                      <Button variant="outline" onClick={handleCancel} data-testid="approval-cancel-button">Cancel</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-300">Auto-approved (low risk).</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Business Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(result?.businessValue ?? [
                    'Richer spatial context than flat maps',
                    'Faster scenario ideation with generated world concepts',
                    'Simulation-ready planning artifacts with governance checkpoints',
                    'Policy-aware world generation for safer rollout decisions',
                    'Instruction-based scene mutation with full audit trail',
                  ]).map((value) => (
                    <li key={value} className="flex items-start gap-2">
                      <Building2 className="mt-0.5 size-4 text-muted-foreground" />
                      <span>{value}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Governance &amp; Trust Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><Shield className="size-4 text-emerald-400" /> Guardrails enforced</p>
                <p className="flex items-center gap-2"><Flag className="size-4 text-emerald-400" /> Policy validation active</p>
                <p className="flex items-center gap-2"><UserCheck className="size-4 text-amber-400" /> Human approval checkpoint</p>
                <p className="flex items-center gap-2"><GitBranch className="size-4 text-blue-400" /> Audit trace: {result?.governance.auditTraceId ?? 'Generated on run'}{spatialTraceId && <code className="ml-1 text-xs font-mono text-muted-foreground">· spatial:{spatialTraceId.slice(0, 8)}</code>}</p>
                <p className="flex items-center gap-2"><FileWarning className="size-4 text-indigo-400" /> Evaluation: {result?.evaluation.passed ? 'pass' : 'review'}</p>
                <p className="flex items-center gap-2"><Shield className="size-4 text-violet-400" /> Parametric schema validation</p>
              </CardContent>
            </Card>

            {(workflowState.status === 'error' || uploadError) && (
              <Card className="border-red-500/40 bg-red-500/10">
                <CardContent className="p-4 text-sm text-red-200">
                  <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4" /> Safe failure mode active</p>
                  <p className="mt-1 text-red-100">The system rejected unsafe or invalid inputs before world output was produced.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      {isPreviewExpanded && canonicalArtifact && sceneSpec && artifactReadiness.valid && (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 backdrop-blur-sm" data-testid="expanded-preview-modal" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col rounded-xl border border-border bg-background/95 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{canonicalArtifact.worldTitle}</p>
                <p className="text-xs text-muted-foreground">Expanded world preview</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={showOverlays ? 'default' : 'outline'}
                  onClick={() => setShowOverlays((value) => !value)}
                  className="gap-2"
                >
                  <Layers3 className="size-4" /> {showOverlays ? 'Hide Overlays' : 'Show Overlays'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setResetToken((value) => value + 1)} className="gap-2">
                  <RotateCcw className="size-4" /> Reset View
                </Button>
                <Button type="button" onClick={handleExportGlb} className="gap-2" disabled={exportState === 'exporting' || !exportEligibility?.eligible}>
                  {exportState === 'exporting' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Export GLB
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsPreviewExpanded(false)} className="gap-2">
                  <Minimize2 className="size-4" /> Close Preview
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsPreviewExpanded(false)} aria-label="Close expanded preview">
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 rounded-lg border border-border bg-background/50 p-2">
              <WorldPreviewErrorBoundary worldId={canonicalArtifact.worldId}>
                <ProceduralWorldCanvas sceneSpec={sceneSpec} resetToken={resetToken} showOverlays={showOverlays} />
              </WorldPreviewErrorBoundary>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
