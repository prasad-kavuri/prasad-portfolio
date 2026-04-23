import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AgentGraph } from '@/app/demos/multi-agent/AgentGraph';
import { AGENT_DEFINITIONS, INITIAL_ORCHESTRATION_STATE } from '@/lib/agents/handoff-model';

describe('AgentGraph', () => {
  it('renders all five agent nodes', () => {
    render(<AgentGraph state={INITIAL_ORCHESTRATION_STATE} definitions={AGENT_DEFINITIONS} />);

    expect(screen.getByTestId('node-analyzer')).toBeInTheDocument();
    expect(screen.getByTestId('node-researcher')).toBeInTheDocument();
    expect(screen.getByTestId('node-strategist')).toBeInTheDocument();
    expect(screen.getByTestId('node-hitl')).toBeInTheDocument();
    expect(screen.getByTestId('node-synthesizer')).toBeInTheDocument();
  });

  it('shows idle class when no workflow is active', () => {
    render(<AgentGraph state={INITIAL_ORCHESTRATION_STATE} definitions={AGENT_DEFINITIONS} />);
    expect(screen.getByTestId('node-analyzer')).toHaveClass('node-idle');
  });

  it('shows active class for active agent', () => {
    const state = { ...INITIAL_ORCHESTRATION_STATE, status: 'running' as const, activeAgent: 'researcher' as const };
    render(<AgentGraph state={state} definitions={AGENT_DEFINITIONS} />);
    expect(screen.getByTestId('node-researcher')).toHaveClass('node-active');
  });

  it('shows awaiting-approval class for hitl node', () => {
    const state = {
      ...INITIAL_ORCHESTRATION_STATE,
      traceId: 'trace',
      status: 'awaiting-approval' as const,
      handoffs: [
        {
          id: 'handoff-1',
          fromAgent: 'strategist' as const,
          toAgent: 'hitl' as const,
          reason: 'approval',
          contextSummary: 'needs review',
          status: 'awaiting-approval' as const,
          timestamp: '1970-01-01T00:00:00.000Z',
          traceId: 'trace',
        },
      ],
    };

    render(<AgentGraph state={state} definitions={AGENT_DEFINITIONS} />);
    expect(screen.getByTestId('node-hitl')).toHaveClass('node-awaiting-approval');
  });

  it('shows blocked class on the blocked edge', () => {
    const state = {
      ...INITIAL_ORCHESTRATION_STATE,
      traceId: 'trace',
      status: 'running' as const,
      handoffs: [
        {
          id: 'handoff-2',
          fromAgent: 'analyzer' as const,
          toAgent: 'researcher' as const,
          reason: 'blocked',
          contextSummary: 'invalid',
          status: 'blocked' as const,
          timestamp: '1970-01-01T00:00:01.000Z',
          traceId: 'trace',
        },
      ],
    };

    render(<AgentGraph state={state} definitions={AGENT_DEFINITIONS} />);
    expect(screen.getByTestId('edge-analyzer-researcher')).toHaveClass('edge-blocked');
  });
});
