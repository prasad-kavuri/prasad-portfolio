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

    expect(screen.getByRole('heading', { name: 'AI Spatial Intelligence & World Generation' })).toBeInTheDocument();
    expect(screen.getByText('Desktop-Friendly')).toBeInTheDocument();
    expect(screen.getByText(/Desktop-friendly:/i)).toBeInTheDocument();
  });

  it('shows approval panel when API returns pending_review and finalizes after approval', async () => {
    mockFetch
      .mockResolvedValueOnce({
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
              worldId: 'world-abcd',
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'completed',
          workflow: [],
          traces: [],
          governance: {
            guardrailsEnforced: true,
            policyValidation: 'pass',
            humanApprovalRequired: true,
            auditTraceId: 'trace-2',
            evaluationStatus: 'pass',
          },
          businessValue: ['value'],
          worldArtifact: {
            worldTitle: 'Downtown concept',
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
              worldId: 'world-ef01',
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
            nextAction: 'Export this world concept into simulation planning and run scenario stress tests against peak demand windows.',
          },
          finalRecommendation: {
            headline: 'headline',
            rationale: 'rationale',
            tradeoffs: ['tradeoff'],
            constraintsApplied: ['constraint'],
            businessImpact: 'impact',
            policyNotes: ['note'],
            alternativesConsidered: ['alt'],
            nextAction: 'Export this world concept into simulation planning and run scenario stress tests against peak demand windows.',
          },
          evaluation: {
            passed: true,
            score: 1,
            checks: [],
          },
          traceId: 'trace-2',
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
      expect(screen.getByText(/Procedural 3D World Artifact/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('world-3d-canvas')).toHaveTextContent('reset=0 overlays=on');
    fireEvent.click(screen.getByRole('button', { name: /Hide Overlays/i }));
    expect(screen.getByTestId('world-3d-canvas')).toHaveTextContent('reset=0 overlays=off');
    fireEvent.click(screen.getByRole('button', { name: /Reset View/i }));
    expect(screen.getByTestId('world-3d-canvas')).toHaveTextContent('reset=1 overlays=off');

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/Evaluation: pass/i)).toBeInTheDocument();
      expect(screen.queryByText(/Human Approval Required/i)).not.toBeInTheDocument();
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
      expect(screen.getByText(/Export unavailable:/i)).toBeInTheDocument();
    });
  });
});
