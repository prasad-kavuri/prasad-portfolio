import {
  hashScenarioSeed,
  pickScenarioVariant,
  type SpatialConstraintProfile,
  type SpatialObjective,
  type SpatialRegion,
} from '@/lib/spatial-scenarios';

export type SpatialStageState = 'idle' | 'running' | 'completed' | 'paused' | 'failed';

export type SpatialWorkflowStage = {
  id:
    | 'scenario-intake'
    | 'spatial-planner'
    | 'world-builder'
    | 'simulation-analyst'
    | 'policy-review'
    | 'human-approval'
    | 'final-recommendation';
  label: string;
  description: string;
  state: SpatialStageState;
};

export type SpatialTraceEntry = {
  sequence: number;
  actor: string;
  action: string;
  summary: string;
  status: 'completed' | 'paused';
  confidence?: number;
};

export type SpatialRecommendation = {
  headline: string;
  rationale: string;
  tradeoffs: string[];
  constraintsApplied: string[];
  businessImpact: string;
  policyNotes: string[];
  alternativesConsidered: string[];
  nextAction: string;
};

export type SpatialSimulationOutput = {
  traceId: string;
  scenario: {
    prompt: string;
    region: SpatialRegion;
    objective: SpatialObjective;
    constraints: SpatialConstraintProfile;
    uploadContext?: {
      fileName: string;
      mimeType: string;
      dimensions: string;
    };
  };
  status: 'pending_review' | 'completed';
  workflow: SpatialWorkflowStage[];
  traces: SpatialTraceEntry[];
  governance: {
    guardrailsEnforced: true;
    policyValidation: 'pass';
    humanApprovalRequired: boolean;
    auditTraceId: string;
    evaluationStatus: 'pass' | 'review';
  };
  businessValue: string[];
  proposedRecommendation: SpatialRecommendation;
  finalRecommendation?: SpatialRecommendation;
};

function objectiveBusinessImpact(objective: SpatialObjective): string {
  if (objective === 'cost') return 'Lower operating spend by reducing route churn and idle minutes.';
  if (objective === 'speed') return 'Improve cycle-time for dispatch and curbside execution.';
  if (objective === 'safety') return 'Reduce exposure to pedestrian and curbside conflict risk.';
  return 'Improve service coverage with explicit tradeoffs on throughput and capacity.';
}

function objectiveTradeoff(objective: SpatialObjective): string {
  if (objective === 'cost') return 'Lowest-cost path increases ETA variance during peak windows.';
  if (objective === 'speed') return 'Fastest corridor raises congestion sensitivity and enforcement risk.';
  if (objective === 'safety') return 'Safety-first routing reduces throughput in dense mixed-use zones.';
  return 'Coverage-maximizing plan increases per-stop operational cost.';
}

export function buildSpatialSimulation(input: {
  traceId: string;
  scenarioPrompt: string;
  region: SpatialRegion;
  objective: SpatialObjective;
  constraints: SpatialConstraintProfile;
  approvalState: 'pending' | 'approved';
  image?: {
    name: string;
    mimeType: string;
    width: number;
    height: number;
  };
}): SpatialSimulationOutput {
  const seed = hashScenarioSeed(`${input.scenarioPrompt}:${input.region}:${input.objective}`);

  const scenarioVariant = pickScenarioVariant(seed, [
    'High-congestion corridor around peak delivery windows.',
    'Mixed pedestrian and vehicle flow with curbside contention.',
    'Operational objective constrained by policy and accessibility standards.',
  ]);

  const approvalRequired = true;

  const workflow: SpatialWorkflowStage[] = [
    {
      id: 'scenario-intake',
      label: 'Scenario Intake',
      description: 'Validate prompt, region, and constraints before planning.',
      state: 'completed',
    },
    {
      id: 'spatial-planner',
      label: 'Spatial Planner',
      description: 'Map hotspots, corridors, and siting constraints.',
      state: 'completed',
    },
    {
      id: 'world-builder',
      label: 'World / Scene Builder',
      description: 'Build lightweight scene context from available inputs.',
      state: 'completed',
    },
    {
      id: 'simulation-analyst',
      label: 'Simulation Analyst',
      description: 'Compare candidate operating strategies.',
      state: 'completed',
    },
    {
      id: 'policy-review',
      label: 'Policy & Safety Review',
      description: 'Apply governance and safety policy checks.',
      state: 'completed',
    },
    {
      id: 'human-approval',
      label: 'Human Approval',
      description: 'Approval checkpoint for higher-impact recommendations.',
      state: input.approvalState === 'approved' ? 'completed' : 'paused',
    },
    {
      id: 'final-recommendation',
      label: 'Final Recommendation',
      description: 'Decision-ready recommendation with business impact.',
      state: input.approvalState === 'approved' ? 'completed' : 'idle',
    },
  ];

  const traces: SpatialTraceEntry[] = [
    {
      sequence: 1,
      actor: 'Scenario Intake',
      action: 'Validated operating envelope',
      summary: `${input.region} selected with ${input.constraints.policyProfile} policy profile.`,
      status: 'completed',
      confidence: 0.98,
    },
    {
      sequence: 2,
      actor: 'Spatial Planner',
      action: 'Identified friction zones',
      summary: `Detected curbside contention and rerouting pressure. ${scenarioVariant}`,
      status: 'completed',
      confidence: 0.87,
    },
    {
      sequence: 3,
      actor: 'World / Scene Builder',
      action: 'Built lightweight context model',
      summary: input.image
        ? `Used uploaded scene context (${input.image.width}x${input.image.height}) with policy-safe downscaling assumptions.`
        : 'Generated baseline scene context from region and objective inputs.',
      status: 'completed',
      confidence: 0.83,
    },
    {
      sequence: 4,
      actor: 'Simulation Analyst',
      action: 'Compared strategy variants',
      summary: 'Evaluated three candidate plans across throughput, delay risk, and policy exposure.',
      status: 'completed',
      confidence: 0.81,
    },
    {
      sequence: 5,
      actor: 'Policy & Safety Review',
      action: 'Ran governance checks',
      summary: 'One high-throughput variant downgraded due to pedestrian safety proximity risk.',
      status: 'completed',
      confidence: 0.94,
    },
    {
      sequence: 6,
      actor: 'Human Approval',
      action: 'Approval checkpoint',
      summary:
        input.approvalState === 'approved'
          ? 'Human approver accepted simulation recommendation for rollout planning.'
          : 'Human approval required before final recommendation can be released.',
      status: input.approvalState === 'approved' ? 'completed' : 'paused',
      confidence: 1,
    },
  ];

  const recommendation: SpatialRecommendation = {
    headline: `Deploy phased ${input.objective}-optimized zoning plan in ${input.region}`,
    rationale:
      'Simulation output shows highest decision quality when policy-safe corridors are prioritized first, then expanded using monitored rollout checkpoints.',
    tradeoffs: [
      objectiveTradeoff(input.objective),
      'Policy-safe siting slightly delays peak throughput gains but materially reduces incident risk.',
    ],
    constraintsApplied: [
      `Budget profile: ${input.constraints.budgetLevel}`,
      `Congestion sensitivity: ${input.constraints.congestionSensitivity}`,
      `Accessibility priority: ${input.constraints.accessibilityPriority ? 'Enabled' : 'Disabled'}`,
      `Policy profile: ${input.constraints.policyProfile}`,
    ],
    businessImpact: objectiveBusinessImpact(input.objective),
    policyNotes: [
      'Policy & safety review completed before recommendation publication.',
      'Recommendation remains gated by human approval for high-impact rollout actions.',
    ],
    alternativesConsidered: [
      'High-throughput variant with weaker pedestrian buffer controls.',
      'Low-cost variant with higher delay risk during peak demand spikes.',
    ],
    nextAction:
      input.approvalState === 'approved'
        ? 'Launch a 2-week pilot in the highest-friction corridor and monitor ETA variance + safety events.'
        : 'Approve or revise recommended rollout before pilot execution.',
  };

  return {
    traceId: input.traceId,
    scenario: {
      prompt: input.scenarioPrompt,
      region: input.region,
      objective: input.objective,
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
    governance: {
      guardrailsEnforced: true,
      policyValidation: 'pass',
      humanApprovalRequired: approvalRequired,
      auditTraceId: input.traceId,
      evaluationStatus: input.approvalState === 'approved' ? 'pass' : 'review',
    },
    businessValue: [
      'Faster scenario analysis for operations leaders',
      'Safer deployment decisions via policy-aware simulation gates',
      'Clearer auditability across agentic planning and approval handoffs',
      'Richer location context for logistics, field, and mobility operations',
    ],
    proposedRecommendation: recommendation,
    finalRecommendation: input.approvalState === 'approved' ? recommendation : undefined,
  };
}
