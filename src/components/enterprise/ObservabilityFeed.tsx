"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createInitialDriftLifecycleState,
  driftLifecycleReducer,
  type DriftEvent,
  type DriftLifecycleStatus,
} from "@/lib/observability-remediation";
import type { OtelEvent, OtelEventType } from "./types";

const EVENT_TYPE_COLORS: Record<OtelEventType, string> = {
  tool_call: "bg-blue-500/20 text-blue-700 border-blue-300",
  connector_call: "bg-purple-500/20 text-purple-700 border-purple-300",
  file_read: "bg-teal-500/20 text-teal-700 border-teal-300",
  file_write: "bg-orange-500/20 text-orange-700 border-orange-300",
  skill_used: "bg-green-500/20 text-green-700 border-green-300",
  action_approved: "bg-emerald-500/20 text-emerald-700 border-emerald-300",
  action_rejected: "bg-red-500/20 text-red-700 border-red-300",
  token_limit_warning: "bg-amber-500/20 text-amber-700 border-amber-300",
};

const ALL_EVENT_TYPES: OtelEventType[] = [
  "tool_call",
  "connector_call",
  "file_read",
  "file_write",
  "skill_used",
  "action_approved",
  "action_rejected",
  "token_limit_warning",
];

const DRIFT_STATUS_STYLES: Record<
  DriftLifecycleStatus,
  { label: string; className: string }
> = {
  stable: {
    label: "Stable",
    className: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  },
  drift_detected: {
    label: "Drift Detected",
    className: "border-red-400/40 bg-red-500/10 text-red-300",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    className: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  },
  remediating: {
    label: "Remediating",
    className: "border-blue-400/40 bg-blue-500/10 text-blue-300",
  },
  stabilized: {
    label: "Stabilized",
    className: "border-cyan-400/40 bg-cyan-500/10 text-cyan-300",
  },
};

function relativeTime(isoTimestamp: string, nowMs: number): string {
  const diffMs = nowMs - new Date(isoTimestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

let refreshCounter = 0;
function makeSimulatedEvent(events: OtelEvent[]): OtelEvent {
  refreshCounter += 1;
  const base = events[refreshCounter % events.length];
  const hasTokenCost = base.tokenCost !== undefined;
  const inputTokens  = hasTokenCost ? Math.floor(200  + Math.random() * 1800) : undefined;
  const outputTokens = hasTokenCost ? Math.floor(50   + Math.random() *  750) : undefined;
  return {
    ...base,
    eventId: `evt-live-${refreshCounter}`,
    timestamp: new Date().toISOString(),
    userId: `${base.teamId.slice(0, 3)}-user-${(refreshCounter % 10) + 1}`,
    tokenCost: hasTokenCost && inputTokens !== undefined && outputTokens !== undefined
      ? { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens }
      : undefined,
  };
}

const NDJSON_SAMPLE = (events: OtelEvent[]): string =>
  events
    .slice(0, 3)
    .map((e) =>
      JSON.stringify({
        time: e.timestamp,
        team: e.teamId,
        user: e.userId,
        event: e.eventType,
        resource: e.resource,
        action: e.action,
        duration_ms: e.durationMs,
        ...(e.tokenCost ? { token_cost: e.tokenCost } : {}),
        metadata: e.metadata,
      })
    )
    .join("\n");

interface Props {
  events: OtelEvent[];
}

function DriftEventTimeline({ events, nowMs }: { events: DriftEvent[]; nowMs: number }) {
  return (
    <div className="space-y-2" data-testid="drift-event-log">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-lg border border-border/60 bg-background/60 px-3 py-2"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">{event.title}</p>
            <span className="text-xs text-muted-foreground">
              {relativeTime(event.occurredAtIso, nowMs)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
        </div>
      ))}
    </div>
  );
}

// Baseline token values seeded from mount time — shown when live-event window has no data yet
function makeBaselineTokens() {
  const r = (Date.now() % 16001) / 16000; // 0–1
  return {
    input:  Math.round(8_000  + r * 16_000), // 8K–24K
    output: Math.round(2_000  + r *  6_000), // 2K–8K
    tpm:    Math.round(80     + r *    240), // 80–320
  };
}

export function ObservabilityFeed({ events: initialEvents }: Props) {
  const [events, setEvents] = useState<OtelEvent[]>(initialEvents);
  const [baseline] = useState(makeBaselineTokens);
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [typeFilters, setTypeFilters] = useState<Set<OtelEventType>>(
    new Set(ALL_EVENT_TYPES)
  );
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showSIEM, setShowSIEM] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [driftState, dispatchDrift] = useReducer(
    driftLifecycleReducer,
    createInitialDriftLifecycleState("auto")
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remediationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setTick((prev) => prev + 1);
      setNowMs(Date.now());
    }, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        setEvents((prev) => [makeSimulatedEvent(initialEvents), ...prev].slice(0, 200));
        setNowMs(Date.now());
      }, 4000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, initialEvents]);

  useEffect(() => {
    if (remediationIntervalRef.current) {
      clearInterval(remediationIntervalRef.current);
      remediationIntervalRef.current = null;
    }

    remediationIntervalRef.current = setInterval(() => {
      dispatchDrift({ type: "TICK" });
    }, 3600);

    return () => {
      if (remediationIntervalRef.current) clearInterval(remediationIntervalRef.current);
    };
  }, []);

  const teams = useMemo(
    () => ["all", ...Array.from(new Set(initialEvents.map((e) => e.teamId)))],
    [initialEvents]
  );

  function toggleType(t: OtelEventType) {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const filtered = useMemo(
    () =>
      events.filter(
        (e) => (teamFilter === "all" || e.teamId === teamFilter) && typeFilters.has(e.eventType)
      ),
    [events, teamFilter, typeFilters]
  );

  const oneHourAgo = nowMs - 3_600_000;
  const hourEvents = events.filter(
    (e) => new Date(e.timestamp).getTime() > oneHourAgo && e.tokenCost
  );
  const hourInput  = hourEvents.reduce((s, e) => s + (e.tokenCost?.inputTokens  ?? 0), 0);
  const hourOutput = hourEvents.reduce((s, e) => s + (e.tokenCost?.outputTokens ?? 0), 0);
  const hourTotal  = hourInput + hourOutput;
  const elapsedMin = Math.max(1, Math.ceil((nowMs - oneHourAgo) / 60000));
  const tpm        = Math.round(hourTotal / elapsedMin);

  // Fallback to mount-time baseline when live rolling window is empty
  const displayInput  = hourInput  > 0 ? hourInput  : baseline.input;
  const displayOutput = hourOutput > 0 ? hourOutput : baseline.output;
  const displayTpm    = tpm        > 0 ? tpm        : baseline.tpm;

  const statusStyle = DRIFT_STATUS_STYLES[driftState.status];

  // Force relative-time refresh
  void tick;

  return (
    <div>
      {showSIEM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Export to SIEM — Sample NDJSON Payload</h3>
              <button
                onClick={() => setShowSIEM(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              This NDJSON format is compatible with Splunk HEC, Cribl, and structured log collectors.
            </p>
            <pre className="max-h-64 overflow-auto rounded border border-border bg-muted p-4 text-xs font-mono">
              {NDJSON_SAMPLE(filtered.slice(0, 3))}
            </pre>
            <button
              onClick={() => setShowSIEM(false)}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Card className="mb-4 border-border bg-card p-4" data-testid="drift-lifecycle-panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Observability Snapshot / Self-Healing Workflow
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Detect → Decide → Remediate → Stabilize lifecycle for controlled production recovery.
            </p>
          </div>
          <Badge className={`border ${statusStyle.className}`} data-testid="drift-status-badge">
            {statusStyle.label}
          </Badge>
        </div>

        <div className="mb-4 grid gap-2 md:grid-cols-4">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Model confidence</p>
            <p className="mt-1 text-base font-semibold" data-testid="metric-model-confidence">
              {(driftState.metrics.modelConfidence * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Retrieval quality</p>
            <p className="mt-1 text-base font-semibold" data-testid="metric-retrieval-quality">
              {(driftState.metrics.retrievalQuality * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Latency p95</p>
            <p className="mt-1 text-base font-semibold" data-testid="metric-latency-p95">
              {driftState.metrics.latencyP95Ms}ms
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Drift score</p>
            <p className="mt-1 text-base font-semibold" data-testid="metric-drift-score">
              {driftState.metrics.driftScore.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-x-2" role="group" aria-label="Remediation mode">
            <button
              type="button"
              onClick={() => dispatchDrift({ type: "SET_MODE", mode: "auto" })}
              className={`rounded border px-3 py-1 text-xs transition-colors ${
                driftState.mode === "auto"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
              data-testid="mode-auto"
            >
              Auto-remediation mode
            </button>
            <button
              type="button"
              onClick={() => dispatchDrift({ type: "SET_MODE", mode: "human" })}
              className={`rounded border px-3 py-1 text-xs transition-colors ${
                driftState.mode === "human"
                  ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
              data-testid="mode-human"
            >
              Human-in-the-loop mode
            </button>
          </div>
          <button
            type="button"
            onClick={() => dispatchDrift({ type: "RESET" })}
            className="rounded border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Reset simulation
          </button>
        </div>

        {driftState.status === "awaiting_approval" && (
          <div
            className="mb-4 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3"
            data-testid="hitl-approval-panel"
          >
            <p className="text-sm font-medium text-amber-200">Human approval required before remediation</p>
            <p className="mt-1 text-xs text-amber-100">
              This snapshot can influence downstream operating decisions. Review and approve remediation plan.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => dispatchDrift({ type: "APPROVE_REMEDIATION" })}
                className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                data-testid="hitl-approve"
              >
                Approve remediation
              </button>
              <button
                type="button"
                onClick={() => dispatchDrift({ type: "CANCEL_REMEDIATION" })}
                className="rounded border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                data-testid="hitl-cancel"
              >
                Keep monitoring only
              </button>
            </div>
          </div>
        )}

        <DriftEventTimeline events={driftState.events} nowMs={nowMs} />
      </Card>

      <div className="mb-4 flex flex-wrap items-start gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Team</label>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-blue-500 focus:outline-none"
          >
            {teams.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All Teams" : t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1 text-xs text-muted-foreground">Event Types</p>
          <div className="flex flex-wrap gap-1">
            {ALL_EVENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                  typeFilters.has(t)
                    ? `${EVENT_TYPE_COLORS[t]} border`
                    : "border-border bg-muted text-muted-foreground opacity-50"
                }`}
              >
                {t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <button
              role="switch"
              aria-checked={autoRefresh}
              aria-label="Toggle auto-refresh"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                autoRefresh ? "bg-green-600" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  autoRefresh ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-xs text-muted-foreground">Auto-refresh</span>
          </label>

          <button
            onClick={() => setShowSIEM(true)}
            className="rounded border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
          >
            Export to SIEM
          </button>
        </div>
      </div>

      <Card className="mb-4 border-border bg-card p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Rolling 1-Hour Token Consumption
        </p>
        <div className="flex flex-wrap gap-6">
          <div>
            <span className="text-xs text-muted-foreground">Input</span>
            <p className="text-lg font-bold text-blue-600">{formatTokens(displayInput)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Output</span>
            <p className="text-lg font-bold text-orange-500">{formatTokens(displayOutput)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Tokens/min</span>
            <p className={`text-lg font-bold ${displayTpm > 5000 ? "text-red-500" : "text-foreground"}`}>
              {formatTokens(displayTpm)}
            </p>
          </div>
          {displayTpm > 5000 && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <span>⚠</span>
              <span>High token rate detected</span>
            </div>
          )}
        </div>
      </Card>

      <Card className="border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Event Feed
            {autoRefresh && <span className="ml-2 animate-pulse text-green-600">● Live</span>}
          </p>
          <span className="text-xs text-muted-foreground">{filtered.length} events</span>
        </div>

        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No events match the current filters.
            </p>
          )}

          {filtered.map((event) => (
            <div key={event.eventId} className="rounded-lg border border-border/50 bg-background/50">
              <div
                className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 transition-colors hover:bg-muted/30"
                onClick={() =>
                  setExpandedId((prev) => (prev === event.eventId ? null : event.eventId))
                }
              >
                <span className="w-14 flex-shrink-0 text-xs text-muted-foreground">
                  {relativeTime(event.timestamp, nowMs)}
                </span>
                <Badge className={`flex-shrink-0 border text-xs ${EVENT_TYPE_COLORS[event.eventType]}`}>
                  {event.eventType.replace(/_/g, " ")}
                </Badge>
                <span className="flex-shrink-0 text-xs text-muted-foreground">{event.userId}</span>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {event.resource} → <span className="text-foreground">{event.action}</span>
                </span>
                <span className="flex-shrink-0 text-xs text-muted-foreground">{event.durationMs}ms</span>
                <span
                  className="flex-shrink-0 text-xs"
                  title={event.approvalMode === "auto" ? "Auto-approved" : "Manual review"}
                >
                  {event.approvalMode === "auto" ? "✓ auto" : "👁 manual"}
                </span>
                {event.tokenCost && (
                  <span className="flex-shrink-0 text-xs text-blue-600">
                    ↗ {formatTokens(event.tokenCost.totalTokens)} tok
                  </span>
                )}
              </div>
              {expandedId === event.eventId && (
                <div className="border-t border-border/30 px-3 pb-3">
                  <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 font-mono text-xs text-muted-foreground">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
