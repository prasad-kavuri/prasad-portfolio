import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

import SpatialSimulationPage from '@/app/demos/spatial-simulation/page';

describe('SpatialSimulationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and desktop-friendly signal', () => {
    render(<SpatialSimulationPage />);

    expect(screen.getByRole('heading', { name: 'AI Spatial Intelligence & Simulation' })).toBeInTheDocument();
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
            { id: 'scenario-intake', label: 'Scenario Intake', description: 'd', state: 'completed' },
            { id: 'spatial-planner', label: 'Spatial Planner', description: 'd', state: 'completed' },
            { id: 'world-builder', label: 'World / Scene Builder', description: 'd', state: 'completed' },
            { id: 'simulation-analyst', label: 'Simulation Analyst', description: 'd', state: 'completed' },
            { id: 'policy-review', label: 'Policy & Safety Review', description: 'd', state: 'completed' },
            { id: 'human-approval', label: 'Human Approval', description: 'd', state: 'paused' },
            { id: 'final-recommendation', label: 'Final Recommendation', description: 'd', state: 'idle' },
          ],
          traces: [
            { sequence: 1, actor: 'Scenario Intake', action: 'validate', summary: 'ok', status: 'completed' },
            { sequence: 2, actor: 'Spatial Planner', action: 'plan', summary: 'ok', status: 'completed' },
            { sequence: 3, actor: 'World / Scene Builder', action: 'scene', summary: 'ok', status: 'completed' },
            { sequence: 4, actor: 'Simulation Analyst', action: 'simulate', summary: 'ok', status: 'completed' },
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
          proposedRecommendation: {
            headline: 'headline',
            rationale: 'rationale',
            tradeoffs: ['tradeoff'],
            constraintsApplied: ['constraint'],
            businessImpact: 'impact',
            policyNotes: ['note'],
            alternativesConsidered: ['alt'],
            nextAction: 'Approve or revise recommended rollout before pilot execution.',
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
          proposedRecommendation: {
            headline: 'headline',
            rationale: 'rationale',
            tradeoffs: ['tradeoff'],
            constraintsApplied: ['constraint'],
            businessImpact: 'impact',
            policyNotes: ['note'],
            alternativesConsidered: ['alt'],
            nextAction: 'Launch a 2-week pilot in the highest-friction corridor and monitor ETA variance + safety events.',
          },
          finalRecommendation: {
            headline: 'headline',
            rationale: 'rationale',
            tradeoffs: ['tradeoff'],
            constraintsApplied: ['constraint'],
            businessImpact: 'impact',
            policyNotes: ['note'],
            alternativesConsidered: ['alt'],
            nextAction: 'Launch a 2-week pilot in the highest-friction corridor and monitor ETA variance + safety events.',
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
            constraints: {
              budgetLevel: 'medium',
              congestionSensitivity: 'medium',
              accessibilityPriority: true,
              policyProfile: 'balanced',
            },
          },
        }),
      });

    render(<SpatialSimulationPage />);

    fireEvent.click(screen.getByRole('button', { name: /Run governed simulation/i }));

    await waitFor(() => {
      expect(screen.getByText(/Human Approval Required/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/Evaluation: pass/i)).toBeInTheDocument();
      expect(screen.queryByText(/Human Approval Required/i)).not.toBeInTheDocument();
    });
  });
});
