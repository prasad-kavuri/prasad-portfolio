import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetStore } from '@/lib/rate-limit';

const mockBuildWorldGeneration = vi.fn();
const mockEvaluateWorldOutput = vi.fn();

vi.mock('@/lib/world-generation', () => ({
  buildWorldGeneration: mockBuildWorldGeneration,
}));

vi.mock('@/lib/world-eval', () => ({
  evaluateWorldOutput: mockEvaluateWorldOutput,
}));

function makeRequest() {
  return new Request('http://localhost/api/demos/world-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '10.11.12.13',
    },
    body: JSON.stringify({
      prompt: 'Generate a governed downtown world with logistics zones, safe corridors, and simulation-ready constraints.',
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
    }),
  });
}

function makePayload(overrides?: Partial<Record<string, unknown>>) {
  return {
    traceId: 'trace-seq',
    scenario: {
      prompt: 'prompt',
      region: 'Downtown Core',
      objective: 'speed',
      style: 'logistics-grid',
      simulationReady: true,
      constraints: {
        budgetLevel: 'medium',
        congestionSensitivity: 'high',
        accessibilityPriority: true,
        policyProfile: 'balanced',
      },
    },
    status: 'pending_review',
    workflow: [
      { id: 'prompt-intake', label: 'Prompt Intake', description: 'd', state: 'completed' },
      { id: 'scene-intent', label: 'Scene Intent', description: 'd', state: 'completed' },
      { id: 'world-generation', label: 'World Generation', description: 'd', state: 'completed' },
      { id: 'asset-structuring', label: 'Asset Structuring', description: 'd', state: 'completed' },
      { id: 'policy-review', label: 'Policy Review', description: 'd', state: 'completed' },
      { id: 'human-approval', label: 'Human Approval', description: 'd', state: 'paused' },
      { id: 'final-world-output', label: 'Final Output', description: 'd', state: 'idle' },
    ],
    traces: [
      { sequence: 1, actor: 'Prompt Intake', action: 'a', summary: 's', status: 'completed' },
      { sequence: 2, actor: 'Scene Intent', action: 'a', summary: 's', status: 'completed' },
      { sequence: 3, actor: 'World Generator', action: 'a', summary: 's', status: 'completed' },
      { sequence: 4, actor: 'Asset Structuring', action: 'a', summary: 's', status: 'completed' },
      { sequence: 5, actor: 'Policy Review', action: 'a', summary: 's', status: 'completed' },
    ],
    worldArtifact: {
      worldTitle: 'Downtown world',
      provider: 'mock-world-provider',
      providerMode: 'mock',
      availability: 'available',
      preview: {
        width: 2,
        height: 2,
        cells: ['road', 'pickup', 'logistics', 'pedestrian'],
        legend: [{ type: 'road', label: 'Route corridor' }],
      },
      assets: {
        meshConcept: 'mesh',
        representation: 'mesh-concept',
        sceneZones: ['zone-1'],
        routeCorridors: ['corridor-1'],
        loadingAreas: ['load-1'],
        pedestrianAreas: ['ped-1'],
        simulationReadiness: 'ready',
      },
      sceneSpec: {
        worldId: 'world-1',
        title: 'scene',
        region: 'Downtown Core',
        objective: 'speed',
        style: 'logistics-grid',
        providerMode: 'mock',
        availability: 'available',
        exportReadiness: 'ready',
        simulationReadiness: 'ready',
        warnings: [],
        primitiveBudget: 42,
        primitives: [
          {
            id: 'ops-core',
            label: 'Operations Core',
            kind: 'zone-block',
            position: { x: 0, z: 0 },
            size: { width: 4, depth: 4 },
            height: 2,
            colorHex: '#2563eb',
          },
        ],
      },
      notes: ['note'],
    },
    governance: {
      guardrailsEnforced: true,
      policyValidation: 'pass',
      humanApprovalRequired: true,
      auditTraceId: 'trace-seq',
      evaluationStatus: 'review',
    },
    businessValue: ['value'],
    proposedRecommendation: {
      headline: 'headline',
      rationale: 'rationale',
      tradeoffs: ['tradeoff'],
      constraintsApplied: ['constraint-1', 'constraint-2'],
      businessImpact: 'impact',
      policyNotes: ['note'],
      alternativesConsidered: ['alt'],
      nextAction: 'approve',
    },
    ...overrides,
  };
}

describe('world generation API sequencing guards', () => {
  beforeEach(() => {
    _resetStore();
    vi.clearAllMocks();
    mockEvaluateWorldOutput.mockReturnValue({ passed: true, score: 1, checks: [] });
  });

  it('rejects approval-required response when artifact is not renderable', async () => {
    mockBuildWorldGeneration.mockResolvedValue(
      makePayload({
        worldArtifact: {
          ...makePayload().worldArtifact,
          sceneSpec: {
            ...makePayload().worldArtifact.sceneSpec,
            primitives: [],
          },
        },
      })
    );

    const { POST } = await import('@/app/api/demos/world-generation/route');
    const response = await POST(makeRequest() as never);

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain('render safety checks');
  });

  it('returns pending_review only when artifact is valid and renderable', async () => {
    mockBuildWorldGeneration.mockResolvedValue(makePayload());

    const { POST } = await import('@/app/api/demos/world-generation/route');
    const response = await POST(makeRequest() as never);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('pending_review');
    expect(body.worldArtifact.sceneSpec.primitives.length).toBeGreaterThan(0);
  });

  it('accepts fallback provider artifacts when renderable payload is complete', async () => {
    mockBuildWorldGeneration.mockResolvedValue(
      makePayload({
        worldArtifact: {
          ...makePayload().worldArtifact,
          providerMode: 'hyworld-adapter',
          availability: 'fallback',
          sceneSpec: {
            ...makePayload().worldArtifact.sceneSpec,
            providerMode: 'hyworld-adapter',
            availability: 'fallback',
          },
          notes: ['fallback note'],
        },
      })
    );

    const { POST } = await import('@/app/api/demos/world-generation/route');
    const response = await POST(makeRequest() as never);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('pending_review');
    expect(body.worldArtifact.availability).toBe('fallback');
    expect(body.worldArtifact.sceneSpec.primitives.length).toBeGreaterThan(0);
  });
});
