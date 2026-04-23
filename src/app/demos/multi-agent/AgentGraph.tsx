'use client';

import { AGENT_ORDER, type AgentId, type OrchestrationState, type AgentDefinition } from '@/lib/agents/handoff-model';

interface AgentGraphProps {
  state: OrchestrationState;
  definitions: Record<AgentId, AgentDefinition>;
}

const NODE_X: Record<AgentId, number> = {
  analyzer: 90,
  researcher: 260,
  strategist: 430,
  hitl: 600,
  synthesizer: 770,
};

const NODE_Y = 112;
const NODE_RADIUS = 34;

type NodeVisualState = 'idle' | 'active' | 'completed' | 'awaiting-approval' | 'blocked';
type EdgeVisualState = 'not-yet' | 'in-progress' | 'completed' | 'blocked';

function getNodeVisualState(state: OrchestrationState, agentId: AgentId): NodeVisualState {
  if (state.activeAgent === agentId && state.status !== 'completed') return 'active';
  if (state.handoffs.some((handoff) => handoff.toAgent === agentId && handoff.status === 'awaiting-approval')) {
    return 'awaiting-approval';
  }
  if (
    state.handoffs.some(
      (handoff) =>
        (handoff.fromAgent === agentId || handoff.toAgent === agentId) &&
        (handoff.status === 'blocked' || handoff.status === 'denied')
    )
  ) {
    return 'blocked';
  }
  if (
    state.status === 'completed' ||
    state.handoffs.some(
      (handoff) =>
        handoff.toAgent === agentId &&
        (handoff.status === 'accepted' || handoff.status === 'approved' || handoff.status === 'completed')
    )
  ) {
    return 'completed';
  }
  return 'idle';
}

function getEdgeVisualState(state: OrchestrationState, from: AgentId, to: AgentId): EdgeVisualState {
  const handoff = state.handoffs.find((item) => item.fromAgent === from && item.toAgent === to);
  if (!handoff) return 'not-yet';
  if (handoff.status === 'blocked' || handoff.status === 'denied') return 'blocked';
  if (handoff.status === 'accepted' || handoff.status === 'completed') return 'completed';
  return 'in-progress';
}

function nodeClasses(visualState: NodeVisualState): string {
  if (visualState === 'active') return 'fill-blue-500 stroke-blue-300';
  if (visualState === 'completed') return 'fill-green-500 stroke-green-300';
  if (visualState === 'awaiting-approval') return 'fill-amber-500 stroke-amber-300';
  if (visualState === 'blocked') return 'fill-red-500 stroke-red-300';
  return 'fill-slate-700 stroke-slate-500';
}

function edgeClasses(visualState: EdgeVisualState): string {
  if (visualState === 'in-progress') return 'stroke-blue-400';
  if (visualState === 'completed') return 'stroke-green-400';
  if (visualState === 'blocked') return 'stroke-red-400';
  return 'stroke-slate-600';
}

function edgeDash(visualState: EdgeVisualState): string | undefined {
  if (visualState === 'not-yet') return '5 5';
  if (visualState === 'blocked') return '6 4';
  return undefined;
}

export function AgentGraph({ state, definitions }: AgentGraphProps) {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-4">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Agent Handoff Graph</h2>
        <p className="text-xs text-muted-foreground">Live communication graph for typed agent handoffs and approval checkpoints.</p>
      </div>

      <svg
        viewBox="0 0 860 230"
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Agent communication graph"
        className="h-auto w-full"
      >
        <defs>
          <marker id="handoff-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 z" className="fill-blue-400" />
          </marker>
        </defs>

        {AGENT_ORDER.slice(0, -1).map((agentId, index) => {
          const next = AGENT_ORDER[index + 1];
          const fromX = NODE_X[agentId] + NODE_RADIUS + 8;
          const toX = NODE_X[next] - NODE_RADIUS - 8;
          const visual = getEdgeVisualState(state, agentId, next);
          return (
            <g key={`${agentId}-${next}`} data-testid={`edge-${agentId}-${next}`} className={`edge-${visual}`}>
              <line
                x1={fromX}
                y1={NODE_Y}
                x2={toX}
                y2={NODE_Y}
                className={`${edgeClasses(visual)} transition-colors`}
                strokeWidth={3}
                strokeDasharray={edgeDash(visual)}
                markerEnd={visual === 'in-progress' ? 'url(#handoff-arrow)' : undefined}
              />
              {visual === 'blocked' ? (
                <g>
                  <rect x={(fromX + toX) / 2 - 24} y={NODE_Y - 24} width={48} height={16} rx={8} className="fill-red-500/90" />
                  <text x={(fromX + toX) / 2} y={NODE_Y - 13} className="fill-white text-[9px]" textAnchor="middle">
                    blocked
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}

        {AGENT_ORDER.map((agentId) => {
          const definition = definitions[agentId];
          const visualState = getNodeVisualState(state, agentId);
          const x = NODE_X[agentId];
          const y = NODE_Y;
          return (
            <g key={agentId} data-testid={`node-${agentId}`} className={`node-${visualState}`}>
              <circle cx={x} cy={y} r={NODE_RADIUS} className={`${nodeClasses(visualState)} stroke-[2.5]`} />
              {visualState === 'active' ? (
                <circle cx={x} cy={y} r={NODE_RADIUS + 6} className="animate-pulse fill-transparent stroke-blue-300/70 stroke-[2]" />
              ) : null}
              {visualState === 'completed' ? (
                <text x={x} y={y + 5} textAnchor="middle" className="fill-white text-sm font-semibold">
                  ✓
                </text>
              ) : null}
              <text x={x} y={y + 54} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
                {definition.label}
              </text>
              {state.activeAgent === agentId ? (
                <text x={x} y={y + 69} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                  {definition.role}
                </text>
              ) : null}
              {visualState === 'awaiting-approval' ? (
                <text x={x} y={y - 45} textAnchor="middle" className="fill-amber-300 text-[10px] font-medium">
                  awaiting
                </text>
              ) : null}
              {visualState === 'blocked' ? (
                <text x={x} y={y - 45} textAnchor="middle" className="fill-red-300 text-[10px] font-medium">
                  blocked
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
