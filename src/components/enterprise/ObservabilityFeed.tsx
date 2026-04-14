"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OtelEvent, OtelEventType } from "./types";

const EVENT_TYPE_COLORS: Record<OtelEventType, string> = {
  tool_call:           'bg-blue-500/20 text-blue-700 border-blue-300',
  connector_call:      'bg-purple-500/20 text-purple-700 border-purple-300',
  file_read:           'bg-teal-500/20 text-teal-700 border-teal-300',
  file_write:          'bg-orange-500/20 text-orange-700 border-orange-300',
  skill_used:          'bg-green-500/20 text-green-700 border-green-300',
  action_approved:     'bg-emerald-500/20 text-emerald-700 border-emerald-300',
  action_rejected:     'bg-red-500/20 text-red-700 border-red-300',
  token_limit_warning: 'bg-amber-500/20 text-amber-700 border-amber-300',
};

const ALL_EVENT_TYPES: OtelEventType[] = [
  'tool_call', 'connector_call', 'file_read', 'file_write',
  'skill_used', 'action_approved', 'action_rejected', 'token_limit_warning',
];

function relativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60)  return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)  return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

let _refreshCounter = 0;
function makeSimulatedEvent(events: OtelEvent[]): OtelEvent {
  _refreshCounter++;
  const base = events[_refreshCounter % events.length];
  return {
    ...base,
    eventId: `evt-live-${_refreshCounter}`,
    timestamp: new Date().toISOString(),
    userId: `${base.teamId.slice(0, 3)}-user-${(_refreshCounter % 10) + 1}`,
  };
}

const NDJSON_SAMPLE = (events: OtelEvent[]): string =>
  events.slice(0, 3).map(e => JSON.stringify({
    time: e.timestamp,
    team: e.teamId,
    user: e.userId,
    event: e.eventType,
    resource: e.resource,
    action: e.action,
    duration_ms: e.durationMs,
    ...(e.tokenCost ? { token_cost: e.tokenCost } : {}),
    metadata: e.metadata,
  })).join('\n');

interface Props {
  events: OtelEvent[];
}

export function ObservabilityFeed({ events: initialEvents }: Props) {
  const [events, setEvents] = useState<OtelEvent[]>(initialEvents);
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [typeFilters, setTypeFilters] = useState<Set<OtelEventType>>(new Set(ALL_EVENT_TYPES));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showSIEM, setShowSIEM] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // for relative timestamp updates
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Relative timestamp refresh
  useEffect(() => {
    const t = setInterval(() => setTick(prev => prev + 1), 10000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        setEvents(prev => [makeSimulatedEvent(initialEvents), ...prev].slice(0, 200));
      }, 4000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  const teams = ['all', ...Array.from(new Set(initialEvents.map(e => e.teamId)))];

  function toggleType(t: OtelEventType) {
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  const filtered = events.filter(e =>
    (teamFilter === 'all' || e.teamId === teamFilter) &&
    typeFilters.has(e.eventType)
  );

  // Rolling 1-hour token stats
  const oneHourAgo = Date.now() - 3_600_000;
  const hourEvents = events.filter(e => new Date(e.timestamp).getTime() > oneHourAgo && e.tokenCost);
  const hourInput  = hourEvents.reduce((s, e) => s + (e.tokenCost?.inputTokens  ?? 0), 0);
  const hourOutput = hourEvents.reduce((s, e) => s + (e.tokenCost?.outputTokens ?? 0), 0);
  const hourTotal  = hourInput + hourOutput;
  const elapsedMin = Math.max(1, Math.ceil((Date.now() - oneHourAgo) / 60000));
  const tpm = Math.round(hourTotal / elapsedMin);

  // Suppress unused tick warning — tick is read to force re-render of relative times
  void tick;

  return (
    <div>
      {/* SIEM export modal */}
      {showSIEM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-2xl shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Export to SIEM — Sample NDJSON Payload</h3>
              <button onClick={() => setShowSIEM(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">This NDJSON format is compatible with Splunk HEC, Cribl, and OpenTelemetry collectors.</p>
            <pre className="bg-muted rounded p-4 text-xs font-mono overflow-auto max-h-64 border border-border">
              {NDJSON_SAMPLE(filtered.slice(0, 3))}
            </pre>
            <button
              onClick={() => setShowSIEM(false)}
              className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-start">
        {/* Team filter */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Team</label>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="bg-background border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-blue-500"
          >
            {teams.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'All Teams' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Event type filter */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Event Types</p>
          <div className="flex flex-wrap gap-1">
            {ALL_EVENT_TYPES.map(t => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                  typeFilters.has(t)
                    ? `${EVENT_TYPE_COLORS[t]} border`
                    : 'bg-muted text-muted-foreground border-border opacity-50'
                }`}
              >
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 ml-auto">
          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <button
              role="switch"
              aria-checked={autoRefresh}
              aria-label="Toggle auto-refresh"
              onClick={() => setAutoRefresh(prev => !prev)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                autoRefresh ? 'bg-green-600' : 'bg-muted'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${autoRefresh ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <span className="text-muted-foreground text-xs">Auto-refresh</span>
          </label>

          {/* SIEM export */}
          <button
            onClick={() => setShowSIEM(true)}
            className="text-xs px-3 py-1.5 border border-border rounded hover:bg-muted transition-colors"
          >
            Export to SIEM
          </button>
        </div>
      </div>

      {/* Rolling 1-hour token meter */}
      <Card className="bg-card border-border p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Rolling 1-Hour Token Consumption</p>
        <div className="flex flex-wrap gap-6">
          <div>
            <span className="text-xs text-muted-foreground">Input</span>
            <p className="text-lg font-bold text-blue-600">{formatTokens(hourInput)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Output</span>
            <p className="text-lg font-bold text-orange-500">{formatTokens(hourOutput)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Tokens/min</span>
            <p className={`text-lg font-bold ${tpm > 5000 ? 'text-red-500' : 'text-foreground'}`}>{formatTokens(tpm)}</p>
          </div>
          {tpm > 5000 && (
            <div className="flex items-center gap-1 text-amber-600 text-xs">
              <span>⚠</span>
              <span>High token rate detected</span>
            </div>
          )}
        </div>
      </Card>

      {/* Event feed */}
      <Card className="bg-card border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Event Feed
            {autoRefresh && <span className="ml-2 text-green-600 animate-pulse">● Live</span>}
          </p>
          <span className="text-xs text-muted-foreground">{filtered.length} events</span>
        </div>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No events match the current filters.</p>
          )}
          {filtered.map(event => (
            <div key={event.eventId} className="border border-border/50 rounded-lg bg-background/50">
              <div
                className="flex flex-wrap gap-2 items-center px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(prev => prev === event.eventId ? null : event.eventId)}
              >
                <span className="text-xs text-muted-foreground w-14 flex-shrink-0">{relativeTime(event.timestamp)}</span>
                <Badge className={`text-xs border flex-shrink-0 ${EVENT_TYPE_COLORS[event.eventType]}`}>
                  {event.eventType.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground flex-shrink-0">{event.userId}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {event.resource} → <span className="text-foreground">{event.action}</span>
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">{event.durationMs}ms</span>
                <span className="text-xs flex-shrink-0" title={event.approvalMode === 'auto' ? 'Auto-approved' : 'Manual review'}>
                  {event.approvalMode === 'auto' ? '✓ auto' : '👁 manual'}
                </span>
                {event.tokenCost && (
                  <span className="text-xs text-blue-600 flex-shrink-0">
                    ↗ {formatTokens(event.tokenCost.totalTokens)} tok
                  </span>
                )}
              </div>
              {expandedId === event.eventId && (
                <div className="px-3 pb-3 border-t border-border/30">
                  <pre className="text-xs text-muted-foreground font-mono mt-2 overflow-auto max-h-32 bg-muted rounded p-2">
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
