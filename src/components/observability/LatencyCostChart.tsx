'use client';

/**
 * LatencyCostChart
 *
 * Shows the operational tradeoff between inference latency (p50/p95/p99)
 * and estimated cost-per-request over a rolling 24-hour window.
 *
 * Data is simulated deterministically — same seed = same chart every load.
 * In production this would connect to your OTEL collector / analytics API.
 *
 * Why this matters: latency and cost are inversely coupled in LLM infra.
 * Caching, streaming, and model routing all shift this curve.
 * This chart lets stakeholders see current operating point and headroom.
 */

import { useState, useRef } from 'react';

export interface DataPoint {
  hour: string;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  costPerRequestUSD: number;
  requestCount: number;
}

/** Exported for unit tests only. */
export function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Exported for unit tests only. */
export function generateData(): DataPoint[] {
  const rand = seededRand(0xdeadbeef);
  const now = new Date();
  const points: DataPoint[] = [];

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    const hourStr = hour.getHours().toString().padStart(2, '0') + ':00';

    const isBusinessHour = hour.getHours() >= 9 && hour.getHours() <= 18;
    const loadFactor = isBusinessHour ? 1.0 + rand() * 0.4 : 0.3 + rand() * 0.3;

    const p50 = Math.round(280 + loadFactor * 180 + rand() * 60);
    const p95 = Math.round(p50 * (1.6 + rand() * 0.4));
    const p99 = Math.round(p95 * (1.3 + rand() * 0.3));

    const cacheHitRate = isBusinessHour ? 0.35 + rand() * 0.2 : 0.1 + rand() * 0.1;
    const baseCost = 0.0008 + rand() * 0.0004;
    const costPerRequest = parseFloat((baseCost * (1 - cacheHitRate * 0.7)).toFixed(5));

    points.push({
      hour: hourStr,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      costPerRequestUSD: costPerRequest,
      requestCount: Math.round(loadFactor * 120 + rand() * 40),
    });
  }

  return points;
}

type LatencyMetric = 'p50' | 'p95' | 'p99';

const WIDTH = 640;
const HEIGHT = 240;
const PADDING = { top: 16, right: 60, bottom: 40, left: 56 };
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;

export function LatencyCostChart() {
  const [data] = useState<DataPoint[]>(() => generateData());
  const [activeMetric, setActiveMetric] = useState<LatencyMetric>('p95');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const latencyKey = activeMetric === 'p50'
    ? 'p50LatencyMs' : activeMetric === 'p95'
    ? 'p95LatencyMs' : 'p99LatencyMs';

  const maxLatency = Math.max(...data.map(d => d[latencyKey])) * 1.15;
  const maxCost    = Math.max(...data.map(d => d.costPerRequestUSD)) * 1.15;
  const xStep = PLOT_W / (data.length - 1);

  const latencyY = (v: number) =>
    PADDING.top + PLOT_H - (v / maxLatency) * PLOT_H;

  const costY = (v: number) =>
    PADDING.top + PLOT_H - (v / maxCost) * PLOT_H;

  const latencyPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${PADDING.left + i * xStep} ${latencyY(d[latencyKey])}`)
    .join(' ');

  const costPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${PADDING.left + i * xStep} ${costY(d.costPerRequestUSD)}`)
    .join(' ');

  const xLabels = data.filter((_, i) => i % 4 === 0);
  const hovered = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div>
      {/* Controls */}
      <div className="flex gap-2 mb-3 items-center flex-wrap">
        {(['p50', 'p95', 'p99'] as LatencyMetric[]).map(m => (
          <button
            key={m}
            onClick={() => setActiveMetric(m)}
            aria-pressed={activeMetric === m}
            className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors ${
              activeMetric === m
                ? 'border border-border bg-muted text-foreground font-medium'
                : 'border border-border/30 bg-transparent text-foreground'
            }`}
          >
            {m.toUpperCase()} latency
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-2 self-center">
          vs. cost/request (24h)
        </span>
      </div>

      {/* SVG chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`Token latency (${activeMetric}) vs cost per request over the last 24 hours`}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = PADDING.top + PLOT_H * (1 - pct);
          return (
            <line
              key={pct}
              x1={PADDING.left} x2={PADDING.left + PLOT_W}
              y1={y} y2={y}
              stroke="currentColor" strokeOpacity={0.15} strokeWidth={0.5}
            />
          );
        })}

        {/* Left Y axis labels (latency) */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const v = Math.round(maxLatency * pct);
          const y = PADDING.top + PLOT_H * (1 - pct);
          return (
            <text key={pct} x={PADDING.left - 6} y={y + 4}
              fontSize={10} textAnchor="end" fill="currentColor" fillOpacity={0.5}>
              {v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`}
            </text>
          );
        })}

        {/* Right Y axis labels (cost) */}
        {[0, 0.5, 1].map(pct => {
          const v = maxCost * pct;
          const y = PADDING.top + PLOT_H * (1 - pct);
          return (
            <text key={pct} x={PADDING.left + PLOT_W + 6} y={y + 4}
              fontSize={10} textAnchor="start" fill="currentColor" fillOpacity={0.5}>
              ${v.toFixed(4)}
            </text>
          );
        })}

        {/* Axis labels */}
        <text
          x={PADDING.left - 36} y={PADDING.top + PLOT_H / 2}
          fontSize={10} textAnchor="middle" fill="currentColor" fillOpacity={0.5}
          transform={`rotate(-90, ${PADDING.left - 36}, ${PADDING.top + PLOT_H / 2})`}
        >
          latency (ms)
        </text>
        <text
          x={PADDING.left + PLOT_W + 46} y={PADDING.top + PLOT_H / 2}
          fontSize={10} textAnchor="middle" fill="currentColor" fillOpacity={0.5}
          transform={`rotate(90, ${PADDING.left + PLOT_W + 46}, ${PADDING.top + PLOT_H / 2})`}
        >
          cost / req ($)
        </text>

        {/* Cost line (teal, dashed) */}
        <path d={costPath} fill="none" stroke="#0F6E56" strokeWidth={1.5} strokeDasharray="4 2" />

        {/* Latency line (blue) */}
        <path d={latencyPath} fill="none" stroke="#185FA5" strokeWidth={2} />

        {/* X axis labels */}
        {xLabels.map(d => {
          const originalIndex = data.indexOf(d);
          return (
            <text
              key={d.hour}
              x={PADDING.left + originalIndex * xStep}
              y={PADDING.top + PLOT_H + 16}
              fontSize={10} textAnchor="middle" fill="currentColor" fillOpacity={0.5}
            >
              {d.hour}
            </text>
          );
        })}

        {/* Hover hit areas */}
        {data.map((_, i) => (
          <rect
            key={i}
            x={PADDING.left + i * xStep - xStep / 2}
            y={PADDING.top}
            width={xStep}
            height={PLOT_H}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}

        {/* Hover crosshair + dots */}
        {hoveredIndex !== null && (
          <>
            <line
              x1={PADDING.left + hoveredIndex * xStep}
              x2={PADDING.left + hoveredIndex * xStep}
              y1={PADDING.top} y2={PADDING.top + PLOT_H}
              stroke="currentColor" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="3 2"
            />
            <circle
              cx={PADDING.left + hoveredIndex * xStep}
              cy={latencyY(data[hoveredIndex][latencyKey])}
              r={4} fill="#185FA5"
            />
            <circle
              cx={PADDING.left + hoveredIndex * xStep}
              cy={costY(data[hoveredIndex].costPerRequestUSD)}
              r={4} fill="#0F6E56"
            />
          </>
        )}
      </svg>

      {/* Tooltip / legend row */}
      <div className="min-h-[40px] mt-2">
        {hovered ? (
          <div className="flex flex-wrap gap-6 text-xs text-muted-foreground border-t border-border/30 pt-2">
            <span className="text-foreground font-medium">{hovered.hour}</span>
            <span>
              <span style={{ color: '#185FA5' }}>{activeMetric.toUpperCase()}</span>
              {' '}{hovered[latencyKey]}ms
            </span>
            <span>
              <span style={{ color: '#0F6E56' }}>cost</span>
              {' '}${hovered.costPerRequestUSD.toFixed(5)}/req
            </span>
            <span>{hovered.requestCount} reqs</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground pt-2">
            Hover to inspect hourly values · <span style={{ color: '#185FA5' }}>Blue</span> = latency · <span style={{ color: '#0F6E56' }}>Teal dashed</span> = cost/request
          </p>
        )}
      </div>

      {/* Annotation */}
      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
        Business hours show higher latency with lower cost/request due to increased cache hit rates.
        Simulated data — production would stream from OTEL collector via{' '}
        <code className="text-[11px]">/api/enterprise-sim</code>.
      </p>
    </div>
  );
}
