"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { TeamSpendConfig, UsageMetrics } from "./types";

function formatUSD(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct > 85 ? 'bg-red-500' :
    pct > 60 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-muted rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

interface AdjustModalProps {
  team: TeamSpendConfig;
  onClose: () => void;
}

function AdjustModal({ team, onClose }: AdjustModalProps) {
  const [budget, setBudget] = useState(team.monthlyBudgetUSD);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-semibold mb-1">Adjust Budget — {team.teamName}</h3>
        <p className="text-xs text-muted-foreground mb-4">Drag to set new monthly budget (simulated)</p>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>$100</span>
            <span className="font-semibold text-foreground">{formatUSD(budget)}</span>
            <span>$10,000</span>
          </div>
          <input
            type="range"
            min={100}
            max={10000}
            step={50}
            value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save (simulated)
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  spendConfigs: TeamSpendConfig[];
  usageMetrics: UsageMetrics[];
}

export function SpendAnalyticsPanel({ spendConfigs, usageMetrics }: Props) {
  const [adjustingTeam, setAdjustingTeam] = useState<TeamSpendConfig | null>(null);

  const totalBudget = spendConfigs.reduce((s, t) => s + t.monthlyBudgetUSD, 0);
  const totalSpent  = spendConfigs.reduce((s, t) => s + t.spentUSD, 0);
  const utilPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const teamsOver80 = spendConfigs.filter(t => (t.spentUSD / t.monthlyBudgetUSD) * 100 > 80).length;

  return (
    <div>
      {adjustingTeam && (
        <AdjustModal team={adjustingTeam} onClose={() => setAdjustingTeam(null)} />
      )}

      {/* Org-level metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Budget', value: formatUSD(totalBudget) },
          { label: 'Total Spent', value: formatUSD(totalSpent) },
          { label: 'Utilization', value: `${utilPct.toFixed(1)}%` },
          { label: 'Teams >80%', value: String(teamsOver80) },
        ].map(card => (
          <Card key={card.label} className="bg-card border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </Card>
        ))}
      </div>

      {/* Per-team spend table */}
      <Card className="bg-card border-border p-4 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Team Budget Utilization</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left pb-2">Team</th>
                <th className="text-right pb-2 px-3">Budget</th>
                <th className="text-left pb-2 px-3 min-w-[160px]">Utilization</th>
                <th className="text-center pb-2 px-3">Alert</th>
                <th className="text-right pb-2 px-3">Remaining</th>
                <th className="text-center pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {spendConfigs.map(team => {
                const pct = (team.spentUSD / team.monthlyBudgetUSD) * 100;
                const remaining = team.monthlyBudgetUSD - team.spentUSD;
                return (
                  <tr key={team.teamId} className="border-b border-border/50 last:border-0">
                    <td className="py-2 font-medium">{team.teamName}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{formatUSD(team.monthlyBudgetUSD)}</td>
                    <td className="py-2 px-3">
                      <ProgressBar pct={pct} />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        pct > team.alertThresholdPct ? 'bg-red-500/20 text-red-600 border-red-300' : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {team.alertThresholdPct}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{formatUSD(remaining)}</td>
                    <td className="py-2">
                      <button
                        onClick={() => setAdjustingTeam(team)}
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-muted transition-colors"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Token cost breakdown */}
      <Card className="bg-card border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Token Cost Breakdown by Team</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left pb-2">Team</th>
                <th className="text-right pb-2 px-3">Input Tokens</th>
                <th className="text-right pb-2 px-3">Output Tokens</th>
                <th className="text-right pb-2 px-3">Cache Tokens</th>
                <th className="text-right pb-2 px-3">Est. Cost</th>
                <th className="text-left pb-2 px-3 min-w-[120px]">Composition</th>
              </tr>
            </thead>
            <tbody>
              {usageMetrics.map(m => {
                const inputCost    = (m.inputTokens     * 3)    / 1_000_000;
                const outputCost   = (m.outputTokens    * 15)   / 1_000_000;
                const cacheCost    = (m.cacheReadTokens * 0.30) / 1_000_000;
                const total        = inputCost + outputCost + cacheCost;
                const inputPct     = total > 0 ? (inputCost  / total) * 100 : 0;
                const outputPct    = total > 0 ? (outputCost / total) * 100 : 0;
                const cachePct     = total > 0 ? (cacheCost  / total) * 100 : 0;
                return (
                  <tr key={m.teamId} className="border-b border-border/50 last:border-0">
                    <td className="py-2 font-medium">{m.teamName}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground font-mono text-xs">{formatTokens(m.inputTokens)}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground font-mono text-xs">{formatTokens(m.outputTokens)}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground font-mono text-xs">{formatTokens(m.cacheReadTokens)}</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatUSD(m.estimatedCostUSD)}</td>
                    <td className="py-2 px-3">
                      {/* Stacked mini bar */}
                      <div className="flex h-3 rounded overflow-hidden w-24">
                        <div className="bg-blue-500" style={{ width: `${inputPct}%` }} title={`Input: ${formatUSD(inputCost)}`} />
                        <div className="bg-orange-400" style={{ width: `${outputPct}%` }} title={`Output: ${formatUSD(outputCost)}`} />
                        <div className="bg-teal-500" style={{ width: `${cachePct}%` }} title={`Cache: ${formatUSD(cacheCost)}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Pricing: $3/MTok input · $15/MTok output · $0.30/MTok cache read (Anthropic API, April 2026)
        </p>
        <div className="flex gap-4 mt-2">
          {[['Input', 'bg-blue-500'], ['Output', 'bg-orange-400'], ['Cache', 'bg-teal-500']].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
