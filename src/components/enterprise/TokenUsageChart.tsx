"use client";

import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import type { DailyTokenUsage } from "./types";

type TimeRange = '7d' | '14d' | '30d';
type BreakdownMode = 'by-type' | 'by-cost';

// Token pricing
const PRICING = { input: 3, output: 15, cacheRead: 0.30 };

function formatY(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

function daysCost(d: DailyTokenUsage): number {
  return (d.inputTokens * PRICING.input + d.outputTokens * PRICING.output + d.cacheReadTokens * PRICING.cacheRead) / 1_000_000;
}

interface TooltipData {
  x: number;
  y: number;
  day: DailyTokenUsage;
}

const CHART_W = 760;
const CHART_H = 220;
const PAD = { left: 60, right: 10, top: 10, bottom: 40 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top  - PAD.bottom;

function buildPath(points: [number, number][], close?: [number, number][]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  if (close) {
    for (let i = close.length - 1; i >= 0; i--) {
      d += ` L ${close[i][0]} ${close[i][1]}`;
    }
    d += ' Z';
  }
  return d;
}

interface Props {
  dailyData: DailyTokenUsage[];
  allTeamsData: DailyTokenUsage[];
  teamOptions: string[];
}

export function TokenUsageChart({ dailyData: _unused, allTeamsData, teamOptions }: Props) {
  // _unused kept for API compatibility; we derive from allTeamsData + teamOptions
  void _unused;

  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [breakdown, setBreakdown] = useState<BreakdownMode>('by-type');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
  const data = allTeamsData.slice(-days);

  // Compute values for chart
  const getValues = useCallback((d: DailyTokenUsage) => {
    if (breakdown === 'by-cost') {
      return {
        a: (d.inputTokens     * PRICING.input)     / 1_000_000,
        b: (d.outputTokens    * PRICING.output)    / 1_000_000,
        c: (d.cacheReadTokens * PRICING.cacheRead) / 1_000_000,
      };
    }
    return { a: d.inputTokens, b: d.outputTokens, c: d.cacheReadTokens };
  }, [breakdown]);

  const maxTotal = Math.max(...data.map(d => {
    const v = getValues(d);
    return v.a + v.b + v.c;
  }), 1);

  const n = data.length;
  const xStep = n > 1 ? INNER_W / (n - 1) : INNER_W;

  function xPos(i: number): number { return PAD.left + i * xStep; }
  function yPos(val: number): number { return PAD.top + INNER_H - (val / maxTotal) * INNER_H; }

  // Build stacked area paths
  const aPoints:  [number, number][] = [];
  const abPoints: [number, number][] = [];
  const abcPoints:[number, number][] = [];
  const basePoints:[number, number][] = [];

  for (let i = 0; i < data.length; i++) {
    const v = getValues(data[i]);
    const x = xPos(i);
    const yA   = yPos(v.a);
    const yAB  = yPos(v.a + v.b);
    const yABC = yPos(v.a + v.b + v.c);
    const yBase= yPos(0);
    aPoints.push([x, yA]);
    abPoints.push([x, yAB]);
    abcPoints.push([x, yABC]);
    basePoints.push([x, yBase]);
  }

  const pathInput  = buildPath(aPoints,  basePoints);
  const pathOutput = buildPath(abPoints, aPoints);
  const pathCache  = buildPath(abcPoints, abPoints);

  // X-axis label interval
  const labelEvery = days <= 7 ? 1 : days <= 14 ? 2 : 5;

  // Totals for summary
  const totalInput  = data.reduce((s, d) => s + d.inputTokens, 0);
  const totalOutput = data.reduce((s, d) => s + d.outputTokens, 0);
  const totalCache  = data.reduce((s, d) => s + d.cacheReadTokens, 0);
  const totalCost   = data.reduce((s, d) => s + daysCost(d), 0);

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || data.length === 0) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * CHART_W;
    const relX = svgX - PAD.left;
    const idx = Math.round(relX / xStep);
    if (idx < 0 || idx >= data.length) { setTooltip(null); return; }
    setTooltip({ x: xPos(idx), y: abcPoints[idx][1], day: data[idx] });
  }

  // teamOptions is available for future use (team selector) but currently we show all-teams aggregated
  void teamOptions;

  return (
    <Card className="bg-card border-border p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Token Usage Over Time</p>
        <div className="ml-auto flex gap-2 flex-wrap">
          {/* Time range */}
          <div className="flex rounded border border-border overflow-hidden text-xs">
            {(['7d', '14d', '30d'] as TimeRange[]).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-1 transition-colors ${timeRange === r ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              >
                {r}
              </button>
            ))}
          </div>
          {/* Breakdown mode */}
          <div className="flex rounded border border-border overflow-hidden text-xs">
            {([['by-type', 'By Type'], ['by-cost', 'By Cost']] as [BreakdownMode, string][]).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setBreakdown(mode)}
                className={`px-2 py-1 transition-colors ${breakdown === mode ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          style={{ minWidth: 320 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Y axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(frac => {
            const y = PAD.top + INNER_H * (1 - frac);
            const val = maxTotal * frac;
            return (
              <g key={frac}>
                <line x1={PAD.left} x2={PAD.left + INNER_W} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.1" />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity="0.5">
                  {breakdown === 'by-cost' ? `$${val.toFixed(1)}` : formatY(val)}
                </text>
              </g>
            );
          })}

          {/* Stacked areas */}
          <path d={pathInput}  fill="#3b82f6" fillOpacity="0.7" />
          <path d={pathOutput} fill="#f97316" fillOpacity="0.7" />
          <path d={pathCache}  fill="#14b8a6" fillOpacity="0.7" />

          {/* X-axis labels */}
          {data.map((d, i) => {
            if (i % labelEvery !== 0) return null;
            const label = d.date.slice(5); // MM-DD
            return (
              <text key={d.date} x={xPos(i)} y={CHART_H - 8} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.5">
                {label}
              </text>
            );
          })}

          {/* Tooltip vertical line */}
          {tooltip && (
            <line
              x1={tooltip.x} x2={tooltip.x}
              y1={PAD.top} y2={PAD.top + INNER_H}
              stroke="currentColor" strokeOpacity="0.4" strokeDasharray="3 3"
            />
          )}
        </svg>

        {/* Tooltip box (HTML overlay) */}
        {tooltip && (() => {
          const v = getValues(tooltip.day);
          const cost = daysCost(tooltip.day);
          return (
            <div
              className="absolute top-2 pointer-events-none bg-background border border-border rounded shadow-lg px-3 py-2 text-xs z-10"
              style={{ left: Math.min(tooltip.x / CHART_W * 100, 70) + '%' }}
            >
              <p className="font-semibold mb-1">{tooltip.day.date}</p>
              <p><span className="text-blue-500">■</span> {breakdown === 'by-cost' ? `Input $${v.a.toFixed(2)}` : `Input ${formatY(Math.round(v.a))}`}</p>
              <p><span className="text-orange-400">■</span> {breakdown === 'by-cost' ? `Output $${v.b.toFixed(2)}` : `Output ${formatY(Math.round(v.b))}`}</p>
              <p><span className="text-teal-500">■</span> {breakdown === 'by-cost' ? `Cache $${v.c.toFixed(2)}` : `Cache ${formatY(Math.round(v.c))}`}</p>
              <p className="border-t border-border mt-1 pt-1 font-semibold">{formatUSD(cost)}</p>
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2">
        {[['Input', '#3b82f6'], ['Output', '#f97316'], ['Cache Reads', '#14b8a6']].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <span>Input: <strong className="text-foreground">{formatY(totalInput)}</strong></span>
        <span>Output: <strong className="text-foreground">{formatY(totalOutput)}</strong></span>
        <span>Cache: <strong className="text-foreground">{formatY(totalCache)}</strong></span>
        <span>Est. Cost ({timeRange}): <strong className="text-foreground">{formatUSD(totalCost)}</strong></span>
      </div>

      {/* Pricing footnote */}
      <p className="text-xs text-muted-foreground/60 mt-2">
        Estimated using Anthropic API pricing: $3/MTok input · $15/MTok output · $0.30/MTok cache read
      </p>
    </Card>
  );
}
