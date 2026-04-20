'use client';
import { useState, useEffect } from 'react';

export function SnapshotTimestamp() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLabel(
        `Snapshot refreshed at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${now.toLocaleDateString()}`
      );
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  if (label === null) {
    return (
      <span
        className="mt-1 inline-block h-3 w-44 rounded-full bg-muted animate-pulse"
        aria-label="Loading timestamp"
      />
    );
  }

  return <p className="text-xs text-slate-500">{label}</p>;
}
