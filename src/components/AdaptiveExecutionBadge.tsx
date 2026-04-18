'use client';
import type { RoutingStrategy, ExecutionMode } from '@/lib/device-intelligence';

interface Props {
  strategy: RoutingStrategy | null;
  className?: string;
}

const MODE_STYLES: Record<ExecutionMode, { dot: string; ring: string; text: string }> = {
  local:     { dot: 'bg-green-400',  ring: 'bg-green-500/10 border-green-500/20',  text: 'text-green-400'  },
  hybrid:    { dot: 'bg-yellow-400', ring: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400' },
  cloud:     { dot: 'bg-blue-400',   ring: 'bg-blue-500/10 border-blue-500/20',    text: 'text-blue-400'   },
  simulated: { dot: 'bg-slate-400',  ring: 'bg-slate-500/10 border-slate-500/20',  text: 'text-slate-400'  },
};

const MODE_LABEL: Record<ExecutionMode, string> = {
  local:     'On-device AI active',
  hybrid:    'Hybrid mode enabled',
  cloud:     'Optimized for your device: Cloud AI active',
  simulated: 'Simulated walkthrough',
};

export function AdaptiveExecutionBadge({ strategy, className = '' }: Props) {
  if (!strategy) return null;
  const s = MODE_STYLES[strategy.mode];
  return (
    <div
      role="status"
      aria-label={`AI execution mode: ${MODE_LABEL[strategy.mode]}`}
      title={strategy.reason}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1
        text-xs font-medium ${s.ring} ${s.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} animate-pulse`} aria-hidden="true" />
      {MODE_LABEL[strategy.mode]}
    </div>
  );
}
