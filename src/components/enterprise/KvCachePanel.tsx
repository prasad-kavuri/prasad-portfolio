'use client';

import { Card } from '@/components/ui/card';
import type { KvCacheMetrics, KvCacheDailyMetrics } from './types';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`;
  return String(n);
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function StorageBar({ usedGB, totalGB, label }: { usedGB: number; totalGB: number; label: string }) {
  const ratio = Math.min(usedGB / totalGB, 1);
  const colour = ratio > 0.80 ? '#ef4444' : ratio > 0.60 ? '#f59e0b' : '#22c55e';
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{usedGB} / {totalGB} GB</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${ratio * 100}%`, background: colour }} />
      </div>
    </div>
  );
}

function HitRateBar({ rate, model }: { rate: number; model: string }) {
  const colour = rate >= 0.75 ? '#22c55e' : rate >= 0.55 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-muted-foreground w-36 shrink-0 truncate">{model}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${rate * 100}%`, background: colour }} />
      </div>
      <span className="text-xs font-semibold w-10 text-right" style={{ color: colour }}>{pct(rate)}</span>
    </div>
  );
}

// ─── SVG sparkline ───────────────────────────────────────────────────────────

function HitRateSpark({ data }: { data: KvCacheDailyMetrics[] }) {
  const W = 600;
  const H = 120;
  const PAD = { top: 10, right: 8, bottom: 24, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (data.length < 2) return null;

  const minV = 0.4;
  const maxV = 1.0;
  const xStep = innerW / (data.length - 1);

  const toX = (i: number) => PAD.left + i * xStep;
  const toY = (v: number) => PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH;

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.cacheHitRate).toFixed(1)}`)
    .join(' ');

  const areaPath =
    `${linePath} L${toX(data.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)}` +
    ` L${PAD.left.toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;

  // y-axis labels
  const yTicks = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  // x-axis: show every ~7th label
  const stride = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data
    .map((d, i) => ({ i, label: d.date.slice(5) }))
    .filter((_, i) => i % stride === 0 || i === data.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" aria-label="Cache hit rate trend">
      <defs>
        <linearGradient id="cacheGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* grid lines */}
      {yTicks.map(t => (
        <g key={t}>
          <line
            x1={PAD.left} y1={toY(t)}
            x2={PAD.left + innerW} y2={toY(t)}
            stroke="var(--border)" strokeWidth={0.5}
          />
          <text
            x={PAD.left - 4} y={toY(t)}
            fill="var(--muted-foreground)" fontSize={9}
            textAnchor="end" dominantBaseline="middle"
          >
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}

      {/* x labels */}
      {xLabels.map(({ i, label }) => (
        <text
          key={i}
          x={toX(i)} y={H - 4}
          fill="var(--muted-foreground)" fontSize={9}
          textAnchor="middle"
        >
          {label}
        </text>
      ))}

      {/* area fill */}
      <path d={areaPath} fill="url(#cacheGrad)" />

      {/* line */}
      <path d={linePath} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinejoin="round" />

      {/* data points on hover simulation — draw dots at each point */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={toX(i)} cy={toY(d.cacheHitRate)}
          r={2.5} fill="#22c55e"
          opacity={0.7}
        >
          <title>{d.date}: {pct(d.cacheHitRate)}</title>
        </circle>
      ))}
    </svg>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function KvCachePanel({ metrics }: { metrics: KvCacheMetrics }) {
  const {
    overallCacheHitRate,
    totalGpuHoursSaved,
    totalCostSavedUSD,
    avgTtftWithCacheMs,
    avgTtftWithoutCacheMs,
    ttftImprovementPct,
    byModel,
    byUseCase,
    dailyTrend,
    storageUtilization: store,
  } = metrics;

  const heroCards = [
    {
      label: 'Cache Hit Rate',
      value: pct(overallCacheHitRate),
      sub: 'fleet-wide average',
      accent: '#22c55e',
    },
    {
      label: 'TTFT Reduction',
      value: `${ttftImprovementPct}%`,
      sub: `${avgTtftWithoutCacheMs}ms → ${avgTtftWithCacheMs}ms`,
      accent: '#3b82f6',
    },
    {
      label: 'GPU Hours Saved',
      value: fmt(totalGpuHoursSaved, 1),
      sub: `this ${metrics.period}`,
      accent: '#a855f7',
    },
    {
      label: 'Cost Avoided',
      value: `$${totalCostSavedUSD.toLocaleString()}`,
      sub: 'cache reads vs full input price',
      accent: '#f59e0b',
    },
  ];

  return (
    <div className="space-y-6">

      {/* Context banner */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">What this shows: </span>
        KV cache stores the attention key-value tensors from previously computed tokens.
        When the same prefix appears again — a shared system prompt, RAG context, or conversation
        history — the serving engine skips recomputation entirely. The result is dramatically lower
        time-to-first-token (TTFT) and significant GPU cost reduction. These metrics reflect a
        simulated multi-model fleet sized for an enterprise deployment.
      </div>

      {/* Hero metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {heroCards.map(c => (
          <Card key={c.label} className="bg-card border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
            <p className="text-2xl font-bold" style={{ color: c.accent }}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* Daily trend */}
      <Card className="bg-card border-border p-5">
        <p className="text-sm font-semibold text-foreground mb-1">Cache Hit Rate — {metrics.period} trend</p>
        <p className="text-xs text-muted-foreground mb-3">
          Gradual improvement as the cache warms. Drops correspond to cold restarts or new model deployments.
        </p>
        <HitRateSpark data={dailyTrend} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Per-model breakdown */}
        <Card className="bg-card border-border p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Hit Rate by Model</p>
          <div className="space-y-3">
            {byModel.map(m => (
              <div key={m.model} className="space-y-1">
                <HitRateBar rate={m.cacheHitRate} model={m.model} />
                <p className="text-[10px] text-muted-foreground pl-[156px]">
                  TTFT: {m.ttftWithCacheMs}ms cached · {m.ttftWithoutCacheMs}ms cold
                  · saved ${m.estimatedCostSavedUSD.toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Use case breakdown */}
        <Card className="bg-card border-border p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Hit Rate by Use Case</p>
          <div className="space-y-3">
            {byUseCase.map(u => (
              <div key={u.useCase}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-40 shrink-0">{u.useCase}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${u.cacheHitRate * 100}%`,
                        background: u.cacheHitRate >= 0.75 ? '#22c55e' : u.cacheHitRate >= 0.55 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-10 text-right text-foreground">{pct(u.cacheHitRate)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground pl-[172px]">{fmt(u.requestCount)} requests</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
            RAG and multi-turn chat benefit most — shared system prompts and conversation history are exact prefix matches.
            One-shot tasks rarely share prefixes, so cache utilisation is naturally lower.
          </p>
        </Card>

      </div>

      {/* Storage tier utilisation */}
      <Card className="bg-card border-border p-5">
        <p className="text-sm font-semibold text-foreground mb-1">Cache Storage Tiers</p>
        <p className="text-xs text-muted-foreground mb-4">
          LMCache tiered architecture: hot KV tensors in GPU VRAM, warm in CPU RAM, cold on NVMe disk.
          Eviction is LRU within each tier with automatic promotion on re-access.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">GPU VRAM (Hot)</p>
            <StorageBar usedGB={store.gpuMemoryUsedGB} totalGB={store.gpuMemoryTotalGB} label="GPU" />
            <p className="text-[10px] text-muted-foreground">~0.4ms retrieval · highest hit rate</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">CPU RAM (Warm)</p>
            <StorageBar usedGB={store.cpuMemoryUsedGB} totalGB={store.cpuMemoryTotalGB} label="CPU" />
            <p className="text-[10px] text-muted-foreground">~4ms retrieval · overflow from GPU</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">NVMe Disk (Cold)</p>
            <StorageBar usedGB={store.diskUsedGB} totalGB={store.diskTotalGB} label="Disk" />
            <p className="text-[10px] text-muted-foreground">~40ms retrieval · long-term retention</p>
          </div>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Simulated data — representative of a production multi-model serving fleet.
        Architecture: LMCache + vLLM · Storage tiers: GPU → CPU → NVMe · Reference:{' '}
        <a
          href="https://github.com/LMCache/LMCache"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          LMCache
        </a>
      </p>

    </div>
  );
}
