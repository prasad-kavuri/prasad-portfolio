"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, History, SlidersHorizontal, RotateCcw } from "lucide-react";
import type { AgentLifecycleSnapshot, RolloutStage } from "@/components/enterprise/types";

function stageColor(stage: RolloutStage): string {
  switch (stage) {
    case 'stable':      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'canary':       return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'rolled_back':  return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'deprecated':   return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    default:              return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AgentLifecyclePanel({ snapshot }: { snapshot: AgentLifecycleSnapshot }) {
  const { versions, overrides, rolloutEvents } = snapshot;

  const byAgent = new Map<string, typeof versions>();
  versions.forEach(v => {
    const list = byAgent.get(v.agentName) ?? [];
    list.push(v);
    byAgent.set(v.agentName, list);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-500" />
          Agent Lifecycle Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Prompt versioning, canary rollout, session-level policy overrides, and rollback history for
          production agents. Promotion to stable requires an eval-gate pass and a human approval.
        </p>
      </div>

      {/* Version / rollout status per agent */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from(byAgent.entries()).map(([agentName, agentVersions]) => (
          <Card key={agentName} className="p-4 bg-card border-border">
            <h3 className="font-semibold text-sm mb-3">{agentName}</h3>
            <div className="space-y-3">
              {agentVersions.map(v => (
                <div key={v.versionId} className="rounded-lg border border-border p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-medium">{v.versionId}</span>
                    <Badge variant="outline" className={`text-[10px] ${stageColor(v.stage)}`}>
                      {v.stage.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground mt-2">
                    <span>Traffic: <span className="text-foreground font-medium">{v.trafficPct}%</span></span>
                    <span>Eval: <span className="text-foreground font-medium">{v.evalScore.toFixed(2)}</span></span>
                    <span>Created: {formatDate(v.createdAt)}</span>
                    <span>Promoted: {formatDate(v.promotedAt)}</span>
                  </div>
                  {v.rollbackOf && (
                    <p className="mt-2 text-[11px] text-red-500 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Rolled back to {v.rollbackOf}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Session-level overrides */}
      <Card className="p-4 bg-card border-border">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-500" />
          Session-Level Policy Overrides
        </h3>
        <div className="space-y-2">
          {overrides.map(o => (
            <div key={o.overrideId} className="flex items-start justify-between gap-4 rounded-lg border border-border p-3 bg-muted/30">
              <div>
                <p className="text-xs font-medium">{o.teamName} &middot; <span className="font-mono">{o.scope}</span> = <span className="font-mono text-blue-500">{o.value}</span></p>
                <p className="text-[11px] text-muted-foreground mt-1">{o.reason}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {o.expiresAt ? `expires ${formatDate(o.expiresAt)}` : 'persistent'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Rollout / rollback history */}
      <Card className="p-4 bg-card border-border">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-500" />
          Rollout History
        </h3>
        <div className="space-y-2">
          {rolloutEvents.map(e => (
            <div key={e.eventId} className="flex items-center justify-between gap-4 text-xs border-b border-border last:border-0 py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{e.action.replace('_', ' ')}</Badge>
                <span className="font-mono text-muted-foreground">{e.versionId}</span>
                <span className="text-muted-foreground">{e.note}</span>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(e.timestamp)} &middot; {e.actor}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
