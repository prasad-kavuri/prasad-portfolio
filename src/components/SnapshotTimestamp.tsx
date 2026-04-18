'use client';
import { useState, useEffect } from 'react';

export function SnapshotTimestamp() {
  const [label, setLabel] = useState('Loading...');

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

  return <p className="text-xs text-slate-500">{label}</p>;
}
