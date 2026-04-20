'use client';

import { useEffect, useState } from 'react';

interface SkillInvocationEvent {
  traceId: string;
  skillId: string;
  skillName: string;
  demoId: string;
  triggeredAt: string;
  durationMs?: number;
  outcome: 'pass' | 'filtered' | 'error';
  meta?: Record<string, unknown>;
}

const OUTCOME_STYLES: Record<string, string> = {
  pass:     'text-green-400 bg-green-500/10 border-green-500/20',
  filtered: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  error:    'text-red-400 bg-red-500/10 border-red-500/20',
};

export function SkillActivityFeed() {
  const [events, setEvents] = useState<SkillInvocationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/skill-invocations?limit=10');
        const data = await res.json() as { invocations?: SkillInvocationEvent[] };
        setEvents(data.invocations ?? []);
      } catch {
        // fail silently — governance page must not crash if this endpoint is empty
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 15_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No skill invocations recorded yet. Try running a demo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event, i) => (
        <div
          key={`${event.traceId}-${i}`}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border text-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-medium text-foreground truncate">{event.skillName}</span>
            <span className="text-muted-foreground shrink-0">→</span>
            <span className="text-muted-foreground truncate capitalize">
              {event.demoId.replace(/-/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {event.durationMs !== undefined && (
              <span className="text-muted-foreground text-xs">{event.durationMs}ms</span>
            )}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                OUTCOME_STYLES[event.outcome] ?? OUTCOME_STYLES.pass
              }`}
            >
              {event.outcome}
            </span>
            <span className="text-muted-foreground text-xs font-mono hidden sm:block">
              {new Date(event.triggeredAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
