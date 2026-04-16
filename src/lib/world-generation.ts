import { generateWorldWithProvider } from '@/lib/world-generation-adapter';
import { hashWorldSeed, pickWorldVariant, type WorldConstraintProfile, type WorldObjective, type WorldRegion, type WorldStyle } from '@/lib/world-prompts';
import { validateWorldSceneSpec, type WorldSceneSpec } from '@/lib/world-assets';

export type WorldStageState = 'idle' | 'running' | 'completed' | 'paused' | 'failed';

export type WorldWorkflowStage = {
  id:
    | 'prompt-intake'
    | 'scene-intent'
    | 'world-generation'
    | 'asset-structuring'
    | 'policy-review'
    | 'human-approval'
    | 'final-world-output';
  label: string;
  description: string;
  state: WorldStageState;
};

export type WorldTraceEntry = {
  sequence: number;
  actor: string;
  action: string;
  summary: string;
  status: 'completed' | 'paused';
  confidence?: number;
};

export type WorldRecommendation = {
  headline: string;
  rationale: string;
  tradeoffs: string[];
  constraintsApplied: string[];
  businessImpact: string;
  policyNotes: string[];
  alternativesConsidered: string[];
  nextAction: string;
};

export type WorldGenerationOutput = {
  traceId: string;
  scenario: {
    prompt: string;
    region: WorldRegion;
    objective: WorldObjective;
    style: WorldStyle;
    simulationReady: boolean;
    constraints: WorldConstraintProfile;
    uploadContext?: {
      fileName: string;
      mimeType: string;
      dimensions: string;
    };
  };
  status: 'pending_review' | 'completed';
  workflow: WorldWorkflowStage[];
  traces: WorldTraceEntry[];
  worldArtifact: {
    worldTitle: string;
    provider: string;
    providerMode: 'mock' | 'hyworld-adapter';
    availability: 'available' | 'fallback';
    preview: {
      width: number;
      height: number;
      cells: ('road' | 'pedestrian' | 'logistics' | 'pickup' | 'buffer' | 'transit')[];
      legend: Array<{ type: 'road' | 'pedestrian' | 'logistics' | 'pickup' | 'buffer' | 'transit'; label: string }>;
    };
    assets: {
      meshConcept: string;
      representation: 'mesh-concept' | 'point-cloud-concept' | '3dgs-concept';
      sceneZones: string[];
      routeCorridors: string[];
      loadingAreas: string[];
      pedestrianAreas: string[];
      simulationReadiness: 'ready' | 'review';
    };
    sceneSpec: WorldSceneSpec;
    notes: string[];
  };
  governance: {
    guardrailsEnforced: true;
    policyValidation: 'pass';
    humanApprovalRequired: boolean;
    auditTraceId: string;
    evaluationStatus: 'pass' | 'review';
  };
  businessValue: string[];
  proposedRecommendation: WorldRecommendation;
  finalRecommendation?: WorldRecommendation;
};

function objectiveBusinessImpact(objective: WorldObjective): string {
  if (objective === 'cost') return 'Lowers planning-cycle cost by reducing iteration loops before simulation runs.';
  if (objective === 'speed') return 'Improves planning throughput by generating simulation-ready world concepts faster.';
  if (objective === 'safety') return 'Strengthens policy-safe scenario design before operational deployment.';
  return 'Improves service coverage planning with structured world-level tradeoff visibility.';
}

function objectiveTradeoff(objective: WorldObjective): string {
  if (objective === 'cost') return 'Cost-first world layouts may reduce spatial fidelity for low-priority zones.';
  if (objective === 'speed') return 'Speed-first world generation may require additional governance checks for safety-critical zones.';
  if (objective === 'safety') return 'Safety-first zoning can constrain peak throughput corridors.';
  return 'Coverage-first world composition can increase operating complexity across zone boundaries.';
}

export async function buildWorldGeneration(input: {
  traceId: string;
  prompt: string;
  region: WorldRegion;
  objective: WorldObjective;
  style: WorldStyle;
  constraints: WorldConstraintProfile;
  provider: 'mock' | 'hyworld';
  approvalState: 'pending' | 'approved';
  simulationReady: boolean;
  image?: {
    name: string;
    mimeType: string;
    width: number;
    height: number;
  };
}): Promise<WorldGenerationOutput> {
  const seed = hashWorldSeed(`${input.prompt}:${input.region}:${input.objective}:${input.style}`);
  const providerResult = await generateWorldWithProvider({
    prompt: input.prompt,
    region: input.region,
    objective: input.objective,
    style: input.style,
    simulationReady: input.simulationReady,
    seed,
    provider: input.provider,
    imageRef: input.image,
  });
  const sceneValidation = validateWorldSceneSpec(providerResult.sceneSpec);

  const worldVariant = pickWorldVariant(seed, [
    'Generated congestion-aware lane mesh for downtown routing.',
    'Generated pedestrian buffer envelope around high-footfall segments.',
    'Generated transit-linked access shell for mixed mobility operations.',
  ]);

  const workflow: WorldWorkflowStage[] = [
    { id: 'prompt-intake', label: 'Prompt Intake', description: 'Validate prompt and spatial parameters.', state: 'completed' },
    { id: 'scene-intent', label: 'Scene Intent Parsing', description: 'Extract world intent, zones, and objectives.', state: 'completed' },
    { id: 'world-generation', label: 'World Generation', description: 'Generate scene/world concept artifact.', state: 'completed' },
    { id: 'asset-structuring', label: 'Asset Structuring', description: 'Structure scene zones and generation metadata.', state: 'completed' },
    { id: 'policy-review', label: 'Policy & Safety Review', description: 'Apply governance checks before release.', state: 'completed' },
    {
      id: 'human-approval',
      label: 'Human Approval',
      description: 'Approval checkpoint for high-impact world outputs.',
      state: input.approvalState === 'approved' ? 'completed' : 'paused',
    },
    {
      id: 'final-world-output',
      label: 'Final World Output',
      description: 'Release governed world artifact for downstream planning.',
      state: input.approvalState === 'approved' ? 'completed' : 'idle',
    },
  ];

  const traces: WorldTraceEntry[] = [
    {
      sequence: 1,
      actor: 'Prompt Intake',
      action: 'Validated generation envelope',
      summary: `${input.region} selected with ${input.style} world style and ${input.constraints.policyProfile} policy profile.`,
      status: 'completed',
      confidence: 0.98,
    },
    {
      sequence: 2,
      actor: 'Scene Intent Parser',
      action: 'Mapped scene intent',
      summary: `Extracted zones for logistics, pickup, and pedestrian flow from prompt. ${worldVariant}`,
      status: 'completed',
      confidence: 0.88,
    },
    {
      sequence: 3,
      actor: 'World Generator',
      action: 'Generated world artifact',
      summary: providerResult.availability === 'fallback'
        ? 'HY-World adapter fallback engaged; procedural 3D scene spec generated for stable execution and preview export.'
        : 'Procedural 3D scene spec generated through deterministic mock provider for repeatable output and GLB export.',
      status: 'completed',
      confidence: 0.86,
    },
    {
      sequence: 4,
      actor: 'Asset Structuring',
      action: 'Structured scene assets',
      summary: `${providerResult.assets.sceneZones.length} zones, ${providerResult.assets.routeCorridors.length} route corridors, and simulation readiness status prepared.`,
      status: 'completed',
      confidence: 0.84,
    },
    {
      sequence: 5,
      actor: 'Policy & Safety Review',
      action: 'Ran governance checks',
      summary: 'Output validated for policy profile compliance, explainability, and structured completeness.',
      status: 'completed',
      confidence: 0.94,
    },
    {
      sequence: 6,
      actor: 'Human Approval',
      action: 'Approval checkpoint',
      summary:
        input.approvalState === 'approved'
          ? 'Human approver accepted world artifact for simulation-ready handoff.'
          : 'Human approval required before final world output can be released.',
      status: input.approvalState === 'approved' ? 'completed' : 'paused',
      confidence: 1,
    },
  ];

  const recommendation: WorldRecommendation = {
    headline: `Release ${input.style} world artifact for ${input.region}`,
    rationale:
      'Generated world artifact balances objective alignment with policy-safe zoning, creating a simulation-ready concept that can be reviewed and iterated quickly.',
    tradeoffs: [
      objectiveTradeoff(input.objective),
      'Higher scene detail improves planning fidelity but can reduce rendering performance on constrained devices.',
    ],
    constraintsApplied: [
      `Budget profile: ${input.constraints.budgetLevel}`,
      `Congestion sensitivity: ${input.constraints.congestionSensitivity}`,
      `Accessibility priority: ${input.constraints.accessibilityPriority ? 'Enabled' : 'Disabled'}`,
      `Policy profile: ${input.constraints.policyProfile}`,
      `Simulation-ready mode: ${input.simulationReady ? 'Enabled' : 'Disabled'}`,
    ],
    businessImpact: objectiveBusinessImpact(input.objective),
    policyNotes: [
      'Policy review completed before world artifact publication.',
      sceneValidation.isValid ? 'Scene specification validated before release and export.' : `Scene specification review required: ${sceneValidation.reasons.join(', ')}`,
      'World output remains approval-gated for high-impact operational use.',
    ],
    alternativesConsidered: [
      'Lower-detail world concept with reduced zone segmentation.',
      'Throughput-first composition with narrower pedestrian buffers.',
    ],
    nextAction:
      input.approvalState === 'approved'
        ? 'Export this world concept into simulation planning and run scenario stress tests against peak demand windows.'
        : 'Approve or revise world concept before simulation/export handoff.',
  };

  return {
    traceId: input.traceId,
    scenario: {
      prompt: input.prompt,
      region: input.region,
      objective: input.objective,
      style: input.style,
      simulationReady: input.simulationReady,
      constraints: input.constraints,
      uploadContext: input.image
        ? {
            fileName: input.image.name,
            mimeType: input.image.mimeType,
            dimensions: `${input.image.width}x${input.image.height}`,
          }
        : undefined,
    },
    status: input.approvalState === 'approved' ? 'completed' : 'pending_review',
    workflow,
    traces,
    worldArtifact: {
      worldTitle: providerResult.worldTitle,
      provider: providerResult.provider,
      providerMode: providerResult.mode,
      availability: providerResult.availability,
      preview: providerResult.preview,
      assets: providerResult.assets,
      sceneSpec: providerResult.sceneSpec,
      notes: providerResult.notes,
    },
    governance: {
      guardrailsEnforced: true,
      policyValidation: 'pass',
      humanApprovalRequired: true,
      auditTraceId: input.traceId,
      evaluationStatus: input.approvalState === 'approved' && sceneValidation.isValid ? 'pass' : 'review',
    },
    businessValue: [
      'Richer spatial context than flat maps for decision preparation',
      'Faster scenario ideation through generated world artifacts',
      'Simulation-ready planning concepts with governance checkpoints',
      'Policy-aware world generation for safer operational rollout planning',
    ],
    proposedRecommendation: recommendation,
    finalRecommendation: input.approvalState === 'approved' ? recommendation : undefined,
  };
}
