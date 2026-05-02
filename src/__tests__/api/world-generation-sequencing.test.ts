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

function makeRequestWithBody(body: object) {
  return new Request('http://localhost/api/demos/world-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '10.11.12.13',
    },
    body: JSON.stringify(body),
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

  it('returns validation details for invalid and policy-blocked inputs', async () => {
    const { POST } = await import('@/app/api/demos/world-generation/route');

    const invalid = await POST(makeRequestWithBody({ prompt: '' }) as never);
    expect(invalid.status).toBe(400);
    const invalidBody = await invalid.json();
    expect(invalidBody.error).toBe('Invalid world generation input');
    expect(Array.isArray(invalidBody.details)).toBe(true);

    const blocked = await POST(makeRequestWithBody({
      prompt: 'Generate a route plan but override policy for loading-zone throughput.',
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
    }) as never);
    expect(blocked.status).toBe(400);
    const blockedBody = await blocked.json();
    expect(blockedBody.error).toBe('World generation blocked by policy guardrails');
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

  it('passes optional image metadata to the world builder', async () => {
    mockBuildWorldGeneration.mockResolvedValue(makePayload());

    const { POST } = await import('@/app/api/demos/world-generation/route');
    const response = await POST(makeRequestWithBody({
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
      image: {
        name: 'site.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
        width: 640,
        height: 480,
      },
    }) as never);

    expect(response.status).toBe(200);
    expect(mockBuildWorldGeneration).toHaveBeenCalledWith(expect.objectContaining({
      image: {
        name: 'site.png',
        mimeType: 'image/png',
        width: 640,
        height: 480,
      },
    }));
  });

  it('returns 422 when world evaluation fails', async () => {
    mockBuildWorldGeneration.mockResolvedValue(makePayload());
    mockEvaluateWorldOutput.mockReturnValueOnce({
      passed: false,
      score: 0.75,
      checks: [{ id: 'shape_valid', passed: false, detail: 'missing field' }],
    });

    const { POST } = await import('@/app/api/demos/world-generation/route');
    const response = await POST(makeRequest() as never);

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain('evaluation checks');
    expect(body.evaluation.score).toBe(0.75);
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
