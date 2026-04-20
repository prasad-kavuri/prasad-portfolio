import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
const { mockExportWorldSceneAsGlb } = vi.hoisted(() => ({
  mockExportWorldSceneAsGlb: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

vi.mock('@/components/demos/world/ProceduralWorldCanvas', () => ({
  ProceduralWorldCanvas: ({ resetToken, showOverlays }: { resetToken: number; showOverlays: boolean }) =>
    React.createElement(
      'div',
      { 'data-testid': 'world-3d-canvas' },
      `3D Canvas reset=${String(resetToken)} overlays=${showOverlays ? 'on' : 'off'}`
    ),
}));

vi.mock('@/lib/world-3d', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/world-3d')>();
  return {
    ...actual,
    exportWorldSceneAsGlb: mockExportWorldSceneAsGlb,
  };
});

import WorldGenerationPage from '@/app/demos/world-generation/page';

describe('WorldGenerationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportWorldSceneAsGlb.mockResolvedValue({ fileName: 'world-demo.glb', byteLength: 1024 });
  });

  it('renders title and desktop-friendly signal', () => {
    render(<WorldGenerationPage />);

    expect(screen.getByRole('heading', { name: 'Real-Time Spatial AI + World Modeling Engine' })).toBeInTheDocument();
    expect(screen.getByText('Desktop-Friendly')).toBeInTheDocument();
    expect(screen.getByText(/Desktop-friendly:/i)).toBeInTheDocument();
  });

  it('shows loading artifact state during generation sequencing', async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    render(<WorldGenerationPage />);
    fireEvent.click(screen.getByRole('button', { name: /Generate governed world/i }));

    expect(screen.getByText(/Preparing world artifact preview/i)).toBeInTheDocument();

    resolveFetch?.({
      ok: true,
      json: async () => ({
        status: 'pending_review',
        workflow: [
          { id: 'prompt-intake', label: 'Prompt Intake', description: 'd', state: 'completed' },
          { id: 'scene-intent', label: 'Scene Intent Parsing', description: 'd', state: 'completed' },
          { id: 'world-generation', label: 'World Generation', description: 'd', state: 'completed' },
          { id: 'asset-structuring', label: 'Asset Structuring', description: 'd', state: 'completed' },
          { id: 'policy-review', label: 'Policy & Safety Review', description: 'd', state: 'completed' },
          { id: 'human-approval', label: 'Human Approval', description: 'd', state: 'paused' },
          { id: 'final-world-output', label: 'Final World Output', description: 'd', state: 'idle' },
        ],
        traces: [
          { sequence: 1, actor: 'Prompt Intake', action: 'validate', summary: 'ok', status: 'completed' },
          { sequence: 2, actor: 'Scene Intent Parser', action: 'intent', summary: 'ok', status: 'completed' },
          { sequence: 3, actor: 'World Generator', action: 'generate', summary: 'ok', status: 'completed' },
          { sequence: 4, actor: 'Asset Structuring', action: 'assets', summary: 'ok', status: 'completed' },
          { sequence: 5, actor: 'Policy & Safety Review', action: 'policy', summary: 'ok', status: 'completed' },
          { sequence: 6, actor: 'Human Approval', action: 'approve', summary: 'Approval checkpoint', status: 'paused' },
        ],
        governance: {
          guardrailsEnforced: true,
          policyValidation: 'pass',
          humanApprovalRequired: true,
          auditTraceId: 'trace-loading',
          evaluationStatus: 'review',
        },
        businessValue: ['value'],
        worldArtifact: {
          worldTitle: 'Loading concept',
          provider: 'hyworld-adapter',
          providerMode: 'hyworld-adapter',
          availability: 'fallback',
          preview: {
            width: 2,
            height: 2,
            cells: ['road', 'pickup', 'logistics', 'pedestrian'],
            legend: [{ type: 'road', label: 'Route corridor' }],
          },
          assets: {
            meshConcept: 'mesh',
            representation: 'mesh-concept',
            sceneZones: ['z1'],
            routeCorridors: ['c1'],
            loadingAreas: ['l1'],
            pedestrianAreas: ['p1'],
            simulationReadiness: 'ready',
          },
          sceneSpec: {
            worldId: 'world-loading',
            title: 'scene',
            region: 'Downtown Core',
            objective: 'speed',
            style: 'logistics-grid',
            providerMode: 'hyworld-adapter',
            availability: 'fallback',
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
          notes: ['fallback note'],
        },
        proposedRecommendation: {
          headline: 'headline',
          rationale: 'rationale',
          tradeoffs: ['tradeoff'],
          constraintsApplied: ['constraint'],
          businessImpact: 'impact',
          policyNotes: ['note'],
          alternativesConsidered: ['alt'],
          nextAction: 'Approve or revise world concept before simulation/export handoff.',
        },
        evaluation: {
          passed: true,
          score: 1,
          checks: [],
        },
        traceId: 'trace-loading',
        scenario: {
          prompt: 'prompt',
          region: 'Downtown Core',
          objective: 'speed',
          style: 'logistics-grid',
          simulationReady: true,
          constraints: {
            budgetLevel: 'medium',
            congestionSensitivity: 'medium',
            accessibilityPriority: true,
            policyProfile: 'balanced',
          },
        },
      }),
    });

    await waitFor(() => {
      expect(screen.getByText(/Human Approval Required/i)).toBeInTheDocument();
      expect(screen.getByTestId('approval-status-label')).toHaveTextContent(/Awaiting approval/i);
      expect(screen.getByTestId('preview-generation-label')).toHaveTextContent(/Procedural 3D \(Fallback Active\)/i);
    });
  });

  it('shows approval panel when API returns pending_review and finalizes after approval', async () => {
    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'pending_review',
          workflow: [
            { id: 'prompt-intake', label: 'Prompt Intake', description: 'd', state: 'completed' },
            { id: 'scene-intent', label: 'Scene Intent Parsing', description: 'd', state: 'completed' },
            { id: 'world-generation', label: 'World Generation', description: 'd', state: 'completed' },
            { id: 'asset-structuring', label: 'Asset Structuring', description: 'd', state: 'completed' },
            { id: 'policy-review', label: 'Policy & Safety Review', description: 'd', state: 'completed' },
            { id: 'human-approval', label: 'Human Approval', description: 'd', state: 'paused' },
            { id: 'final-world-output', label: 'Final World Output', description: 'd', state: 'idle' },
          ],
          traces: [
            { sequence: 1, actor: 'Prompt Intake', action: 'validate', summary: 'ok', status: 'completed' },
            { sequence: 2, actor: 'Scene Intent Parser', action: 'intent', summary: 'ok', status: 'completed' },
            { sequence: 3, actor: 'World Generator', action: 'generate', summary: 'ok', status: 'completed' },
            { sequence: 4, actor: 'Asset Structuring', action: 'assets', summary: 'ok', status: 'completed' },
            { sequence: 5, actor: 'Policy & Safety Review', action: 'policy', summary: 'ok', status: 'completed' },
            { sequence: 6, actor: 'Human Approval', action: 'approve', summary: 'Approval checkpoint', status: 'paused' },
          ],
          governance: {
            guardrailsEnforced: true,
            policyValidation: 'pass',
            humanApprovalRequired: true,
            auditTraceId: 'trace-1',
            evaluationStatus: 'review',
          },
          businessValue: ['value'],
          worldArtifact: {
            worldTitle: 'Downtown concept',
            provider: 'hyworld-adapter',
            providerMode: 'hyworld-adapter',
            availability: 'fallback',
            preview: {
              width: 2,
              height: 2,
              cells: ['road', 'pickup', 'logistics', 'pedestrian'],
              legend: [{ type: 'road', label: 'Route corridor' }],
            },
            assets: {
              meshConcept: 'mesh',
              representation: 'mesh-concept',
              sceneZones: ['z1'],
              routeCorridors: ['c1'],
              loadingAreas: ['l1'],
              pedestrianAreas: ['p1'],
              simulationReadiness: 'ready',
            },
            sceneSpec: {
              worldId: 'world-ef01',
              title: 'scene',
              region: 'Downtown Core',
              objective: 'speed',
              style: 'logistics-grid',
              providerMode: 'hyworld-adapter',
              availability: 'fallback',
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
            notes: ['fallback note'],
          },
          proposedRecommendation: {
            headline: 'headline',
            rationale: 'rationale',
            tradeoffs: ['tradeoff'],
            constraintsApplied: ['constraint'],
            businessImpact: 'impact',
            policyNotes: ['note'],
            alternativesConsidered: ['alt'],
            nextAction: 'Approve or revise world concept before simulation/export handoff.',
          },
          evaluation: {
            passed: true,
            score: 1,
            checks: [],
          },
          traceId: 'trace-1',
          scenario: {
            prompt: 'prompt',
            region: 'Downtown Core',
            objective: 'speed',
            style: 'logistics-grid',
            simulationReady: true,
            constraints: {
              budgetLevel: 'medium',
              congestionSensitivity: 'medium',
              accessibilityPriority: true,
              policyProfile: 'balanced',
            },
          },
        }),
      });

    render(<WorldGenerationPage />);

    fireEvent.click(screen.getByRole('button', { name: /Generate governed world/i }));

    await waitFor(() => {
      expect(screen.getByText(/Human Approval Required/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Export GLB/i }));
    await waitFor(() => {
      expect(mockExportWorldSceneAsGlb).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Scene exported: world-demo\.glb/i)).toBeInTheDocument();
      expect(screen.getByTestId('export-feedback')).toBeInTheDocument();
      expect(screen.getByText(/Procedural 3D World Artifact/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('world-3d-canvas')).toHaveTextContent('reset=0 overlays=on');
    fireEvent.click(screen.getByRole('button', { name: /Hide Overlays/i }));
    expect(screen.getByTestId('world-3d-canvas')).toHaveTextContent('reset=0 overlays=off');
    fireEvent.click(screen.getByRole('button', { name: /Reset View/i }));
    expect(screen.getByTestId('world-3d-canvas')).toHaveTextContent('reset=1 overlays=off');

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Evaluation: pass/i)).toBeInTheDocument();
      expect(screen.getByText(/Human Approval Required/i)).toBeInTheDocument();
      expect(screen.getByText(/Procedural 3D World Artifact/i)).toBeInTheDocument();
      expect(screen.getByTestId('approval-status-label')).toHaveTextContent(/Approved/i);
    });
  });

  it('shows safe export failure message when GLB export fails', async () => {
    mockExportWorldSceneAsGlb.mockRejectedValueOnce(new Error('Export unavailable: scene_export_readiness_review'));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'pending_review',
        workflow: [
          { id: 'prompt-intake', label: 'Prompt Intake', description: 'd', state: 'completed' },
          { id: 'scene-intent', label: 'Scene Intent Parsing', description: 'd', state: 'completed' },
          { id: 'world-generation', label: 'World Generation', description: 'd', state: 'completed' },
          { id: 'asset-structuring', label: 'Asset Structuring', description: 'd', state: 'completed' },
          { id: 'policy-review', label: 'Policy & Safety Review', description: 'd', state: 'completed' },
          { id: 'human-approval', label: 'Human Approval', description: 'd', state: 'paused' },
          { id: 'final-world-output', label: 'Final World Output', description: 'd', state: 'idle' },
        ],
        traces: [
          { sequence: 1, actor: 'Prompt Intake', action: 'validate', summary: 'ok', status: 'completed' },
          { sequence: 2, actor: 'Scene Intent Parser', action: 'intent', summary: 'ok', status: 'completed' },
          { sequence: 3, actor: 'World Generator', action: 'generate', summary: 'ok', status: 'completed' },
          { sequence: 4, actor: 'Asset Structuring', action: 'assets', summary: 'ok', status: 'completed' },
          { sequence: 5, actor: 'Policy & Safety Review', action: 'policy', summary: 'ok', status: 'completed' },
          { sequence: 6, actor: 'Human Approval', action: 'approve', summary: 'Approval checkpoint', status: 'paused' },
        ],
        governance: {
          guardrailsEnforced: true,
          policyValidation: 'pass',
          humanApprovalRequired: true,
          auditTraceId: 'trace-3',
          evaluationStatus: 'review',
        },
        businessValue: ['value'],
        worldArtifact: {
          worldTitle: 'Downtown concept',
          provider: 'hyworld-adapter',
          providerMode: 'hyworld-adapter',
          availability: 'fallback',
          preview: {
            width: 2,
            height: 2,
            cells: ['road', 'pickup', 'logistics', 'pedestrian'],
            legend: [{ type: 'road', label: 'Route corridor' }],
          },
          assets: {
            meshConcept: 'mesh',
            representation: 'mesh-concept',
            sceneZones: ['z1'],
            routeCorridors: ['c1'],
            loadingAreas: ['l1'],
            pedestrianAreas: ['p1'],
            simulationReadiness: 'ready',
          },
          sceneSpec: {
            worldId: 'world-review',
            title: 'scene',
            region: 'Downtown Core',
            objective: 'speed',
            style: 'logistics-grid',
            providerMode: 'hyworld-adapter',
            availability: 'fallback',
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
          notes: ['fallback note'],
        },
        proposedRecommendation: {
          headline: 'headline',
          rationale: 'rationale',
          tradeoffs: ['tradeoff'],
          constraintsApplied: ['constraint'],
          businessImpact: 'impact',
          policyNotes: ['note'],
          alternativesConsidered: ['alt'],
          nextAction: 'Approve or revise world concept before simulation/export handoff.',
        },
        evaluation: {
          passed: true,
          score: 1,
          checks: [],
        },
        traceId: 'trace-3',
        scenario: {
          prompt: 'prompt',
          region: 'Downtown Core',
          objective: 'speed',
          style: 'logistics-grid',
          simulationReady: false,
          constraints: {
            budgetLevel: 'medium',
            congestionSensitivity: 'medium',
            accessibilityPriority: true,
            policyProfile: 'balanced',
          },
        },
      }),
    });

    render(<WorldGenerationPage />);
    fireEvent.click(screen.getByRole('button', { name: /Generate governed world/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Export GLB' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Export GLB' }));
    await waitFor(() => {
      expect(screen.getByText(/Export failed — please retry/i)).toBeInTheDocument();
    });
  });

  it('shows auto-approved label when governance does not require human approval', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'completed',
        workflow: [
          { id: 'prompt-intake', label: 'Prompt Intake', description: 'd', state: 'completed' },
          { id: 'scene-intent', label: 'Scene Intent Parsing', description: 'd', state: 'completed' },
          { id: 'world-generation', label: 'World Generation', description: 'd', state: 'completed' },
          { id: 'asset-structuring', label: 'Asset Structuring', description: 'd', state: 'completed' },
          { id: 'policy-review', label: 'Policy & Safety Review', description: 'd', state: 'completed' },
          { id: 'human-approval', label: 'Human Approval', description: 'd', state: 'completed' },
          { id: 'final-world-output', label: 'Final World Output', description: 'd', state: 'completed' },
        ],
        traces: [],
        governance: {
          guardrailsEnforced: true,
          policyValidation: 'pass',
          humanApprovalRequired: false,
          auditTraceId: 'trace-auto',
          evaluationStatus: 'pass',
        },
        businessValue: ['value'],
        worldArtifact: {
          worldTitle: 'Auto world',
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
            sceneZones: ['z1'],
            routeCorridors: ['c1'],
            loadingAreas: ['l1'],
            pedestrianAreas: ['p1'],
            simulationReadiness: 'ready',
          },
          sceneSpec: {
            worldId: 'world-auto',
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
          notes: ['mock note'],
        },
        proposedRecommendation: {
          headline: 'headline',
          rationale: 'rationale',
          tradeoffs: ['tradeoff'],
          constraintsApplied: ['constraint'],
          businessImpact: 'impact',
          policyNotes: ['note'],
          alternativesConsidered: ['alt'],
          nextAction: 'Proceed',
        },
        evaluation: {
          passed: true,
          score: 1,
          checks: [],
        },
        traceId: 'trace-auto',
        scenario: {
          prompt: 'prompt',
          region: 'Downtown Core',
          objective: 'speed',
          style: 'logistics-grid',
          simulationReady: true,
          constraints: {
            budgetLevel: 'medium',
            congestionSensitivity: 'medium',
            accessibilityPriority: true,
            policyProfile: 'balanced',
          },
        },
      }),
    });

    render(<WorldGenerationPage />);
    fireEvent.click(screen.getByRole('button', { name: /Generate governed world/i }));

    await waitFor(() => {
      expect(screen.getByTestId('approval-status-label')).toHaveTextContent(/Auto-approved \(low risk\)/i);
      expect(screen.getByTestId('preview-generation-label')).toHaveTextContent(/Procedural 3D \(Deterministic Mock\)/i);
    });
  });

  it('supports revision request while preserving preview and scenario switching', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'pending_review',
        workflow: [
          { id: 'prompt-intake', label: 'Prompt Intake', description: 'd', state: 'completed' },
          { id: 'scene-intent', label: 'Scene Intent Parsing', description: 'd', state: 'completed' },
          { id: 'world-generation', label: 'World Generation', description: 'd', state: 'completed' },
          { id: 'asset-structuring', label: 'Asset Structuring', description: 'd', state: 'completed' },
          { id: 'policy-review', label: 'Policy & Safety Review', description: 'd', state: 'completed' },
          { id: 'human-approval', label: 'Human Approval', description: 'd', state: 'paused' },
          { id: 'final-world-output', label: 'Final World Output', description: 'd', state: 'idle' },
        ],
        traces: [],
        governance: {
          guardrailsEnforced: true,
          policyValidation: 'pass',
          humanApprovalRequired: true,
          auditTraceId: 'trace-revision',
          evaluationStatus: 'review',
        },
        businessValue: ['value'],
        worldArtifact: {
          worldTitle: 'Revision concept',
          provider: 'hyworld-adapter',
          providerMode: 'hyworld-adapter',
          availability: 'fallback',
          preview: {
            width: 2,
            height: 2,
            cells: ['road', 'pickup', 'logistics', 'pedestrian'],
            legend: [{ type: 'road', label: 'Route corridor' }],
          },
          assets: {
            meshConcept: 'mesh',
            representation: 'mesh-concept',
            sceneZones: ['z1'],
            routeCorridors: ['c1'],
            loadingAreas: ['l1'],
            pedestrianAreas: ['p1'],
            simulationReadiness: 'ready',
          },
          sceneSpec: {
            worldId: 'world-revision',
            title: 'scene',
            region: 'Downtown Core',
            objective: 'speed',
            style: 'logistics-grid',
            providerMode: 'hyworld-adapter',
            availability: 'fallback',
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
          notes: ['fallback note'],
        },
        proposedRecommendation: {
          headline: 'headline',
          rationale: 'rationale',
          tradeoffs: ['tradeoff'],
          constraintsApplied: ['constraint'],
          businessImpact: 'impact',
          policyNotes: ['note'],
          alternativesConsidered: ['alt'],
          nextAction: 'Approve or revise world concept before simulation/export handoff.',
        },
        evaluation: {
          passed: true,
          score: 1,
          checks: [],
        },
        traceId: 'trace-revision',
        scenario: {
          prompt: 'prompt',
          region: 'Downtown Core',
          objective: 'speed',
          style: 'logistics-grid',
          simulationReady: true,
          constraints: {
            budgetLevel: 'medium',
            congestionSensitivity: 'medium',
            accessibilityPriority: true,
            policyProfile: 'balanced',
          },
        },
      }),
    });

    render(<WorldGenerationPage />);
    fireEvent.click(screen.getByRole('button', { name: /Generate governed world/i }));

    await waitFor(() => {
      expect(screen.getByTestId('scenario-baseline')).toBeInTheDocument();
      expect(screen.getByTestId('world-3d-canvas')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Request Revision/i }));
    expect(screen.getByTestId('approval-status-label')).toHaveTextContent(/Revision requested/i);
    expect(screen.getByTestId('world-3d-canvas')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('scenario-safety'));
    expect(screen.getByText(/Safety-optimized scenario/i)).toBeInTheDocument();
  });

  it('opens and closes expanded preview without losing the active artifact', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'pending_review',
        workflow: [],
        traces: [],
        governance: {
          guardrailsEnforced: true,
          policyValidation: 'pass',
          humanApprovalRequired: true,
          auditTraceId: 'trace-expand',
          evaluationStatus: 'review',
        },
        businessValue: ['value'],
        worldArtifact: {
          worldTitle: 'Expanded concept',
          provider: 'hyworld-adapter',
          providerMode: 'hyworld-adapter',
          availability: 'fallback',
          preview: {
            width: 2,
            height: 2,
            cells: ['road', 'pickup', 'logistics', 'pedestrian'],
            legend: [{ type: 'road', label: 'Route corridor' }],
          },
          assets: {
            meshConcept: 'mesh',
            representation: 'mesh-concept',
            sceneZones: ['z1'],
            routeCorridors: ['c1'],
            loadingAreas: ['l1'],
            pedestrianAreas: ['p1'],
            simulationReadiness: 'ready',
          },
          sceneSpec: {
            worldId: 'world-expand',
            title: 'scene',
            region: 'Downtown Core',
            objective: 'speed',
            style: 'logistics-grid',
            providerMode: 'hyworld-adapter',
            availability: 'fallback',
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
          notes: ['fallback note'],
        },
        proposedRecommendation: {
          headline: 'headline',
          rationale: 'rationale',
          tradeoffs: ['tradeoff'],
          constraintsApplied: ['constraint'],
          businessImpact: 'impact',
          policyNotes: ['note'],
          alternativesConsidered: ['alt'],
          nextAction: 'Approve or revise world concept before simulation/export handoff.',
        },
        evaluation: {
          passed: true,
          score: 1,
          checks: [],
        },
        traceId: 'trace-expand',
        scenario: {
          prompt: 'prompt',
          region: 'Downtown Core',
          objective: 'speed',
          style: 'logistics-grid',
          simulationReady: true,
          constraints: {
            budgetLevel: 'medium',
            congestionSensitivity: 'medium',
            accessibilityPriority: true,
            policyProfile: 'balanced',
          },
        },
      }),
    });

    render(<WorldGenerationPage />);
    fireEvent.click(screen.getByRole('button', { name: /Generate governed world/i }));

    await waitFor(() => {
      expect(screen.getByTestId('expand-preview-button')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('expand-preview-button'));
    expect(screen.getByTestId('expanded-preview-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Close Preview/i }));
    expect(screen.queryByTestId('expanded-preview-modal')).not.toBeInTheDocument();
    expect(screen.getByText(/Procedural 3D World Artifact/i)).toBeInTheDocument();
  });

  it('does not enter approval when artifact readiness validation fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'pending_review',
        workflow: [],
        traces: [],
        governance: {
          guardrailsEnforced: true,
          policyValidation: 'pass',
          humanApprovalRequired: true,
          auditTraceId: 'trace-invalid',
          evaluationStatus: 'review',
        },
        businessValue: ['value'],
        worldArtifact: {
          worldTitle: 'Broken world',
          provider: 'hyworld-adapter',
          providerMode: 'hyworld-adapter',
          availability: 'fallback',
          preview: {
            width: 2,
            height: 2,
            cells: [],
            legend: [{ type: 'road', label: 'Route corridor' }],
          },
          assets: {
            meshConcept: 'mesh',
            representation: 'mesh-concept',
            sceneZones: [],
            routeCorridors: [],
            loadingAreas: [],
            pedestrianAreas: [],
            simulationReadiness: 'review',
          },
          sceneSpec: {
            worldId: 'world-broken',
            title: 'scene',
            region: 'Downtown Core',
            objective: 'speed',
            style: 'logistics-grid',
            providerMode: 'hyworld-adapter',
            availability: 'fallback',
            exportReadiness: 'review',
            simulationReadiness: 'review',
            warnings: [],
            primitiveBudget: 42,
            primitives: [],
          },
          notes: ['fallback note'],
        },
        proposedRecommendation: {
          headline: 'headline',
          rationale: 'rationale',
          tradeoffs: ['tradeoff'],
          constraintsApplied: ['constraint'],
          businessImpact: 'impact',
          policyNotes: ['note'],
          alternativesConsidered: ['alt'],
          nextAction: 'Approve or revise world concept before simulation/export handoff.',
        },
        evaluation: {
          passed: true,
          score: 1,
          checks: [],
        },
        traceId: 'trace-invalid',
        scenario: {
          prompt: 'prompt',
          region: 'Downtown Core',
          objective: 'speed',
          style: 'logistics-grid',
          simulationReady: true,
          constraints: {
            budgetLevel: 'medium',
            congestionSensitivity: 'medium',
            accessibilityPriority: true,
            policyProfile: 'balanced',
          },
        },
      }),
    });

    render(<WorldGenerationPage />);
    fireEvent.click(screen.getByRole('button', { name: /Generate governed world/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed readiness checks/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Human Approval Required/i)).not.toBeInTheDocument();
    expect(screen.getByText(/failed before a renderable artifact was available/i)).toBeInTheDocument();
  });
});
