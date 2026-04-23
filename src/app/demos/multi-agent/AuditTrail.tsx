'use client';

import { useMemo, useState } from 'react';
import type { AuditEvent } from '@/lib/agents/handoff-model';
import { Button } from '@/components/ui/button';

interface AuditTrailProps {
  events: AuditEvent[];
  maxVisible?: number;
}

function severityClass(severity: AuditEvent['severity']): string {
  if (severity === 'ok') return 'bg-green-500';
  if (severity === 'warn') return 'bg-amber-500';
  return 'bg-slate-500';
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function AuditTrail({ events, maxVisible = 8 }: AuditTrailProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleEvents = useMemo(
    () => (showAll ? events : events.slice(Math.max(0, events.length - maxVisible))),
    [events, maxVisible, showAll]
  );

  const copyTrace = async () => {
    await navigator.clipboard.writeText(JSON.stringify(events, null, 2));
  };

  return (
    <div className="rounded-xl border border-border bg-card/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Audit Trail</h2>
          <p className="text-xs text-muted-foreground">Structured event log for each workflow transition.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void copyTrace()}>
          Copy trace
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">No events yet. Start a workflow to generate an audit trail.</p>
      ) : (
        <div className="max-h-72 space-y-2 overflow-auto pr-1" aria-label="Audit events">
          {visibleEvents.map((event) => (
            <div
              key={event.id}
              data-testid={`audit-event-${event.id}`}
              className="animate-in slide-in-from-bottom-1 rounded-md border border-border bg-background/60 px-3 py-2 text-xs duration-200"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">[{formatTime(event.timestamp)}]</span>
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px]">
                  {event.agentId}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">{event.eventType}</span>
                <span aria-hidden className={`inline-block size-2 rounded-full ${severityClass(event.severity)}`} />
              </div>
              <p className="mt-1 text-foreground">{event.description}</p>
            </div>
          ))}
        </div>
      )}

      {events.length > maxVisible ? (
        <div className="mt-3">
          <button
            type="button"
            className="text-xs text-blue-500 hover:text-blue-400"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? 'Show recent' : 'Show all'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
