'use client';
import { useEffect, useState } from 'react';

interface Props {
  show: boolean;
  message: string;
  onDismiss?: () => void;
}

export function ExecutionModeToast({ show, message, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => { setVisible(false); onDismiss?.(); }, 4_000);
      return () => clearTimeout(t);
    }
  }, [show, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 rounded-lg border border-blue-500/20
        bg-slate-900/95 px-4 py-3 shadow-lg backdrop-blur-sm
        text-sm text-blue-300 max-w-sm w-[calc(100%-2rem)]"
    >
      <svg className="h-4 w-4 flex-shrink-0 text-blue-400" viewBox="0 0 20 20"
        fill="currentColor" aria-hidden="true">
        <path d="M5.5 16a3.5 3.5 0 01-.369-6.98A4 4 0 1113.5 9H14a3 3 0 010 6H5.5z"/>
      </svg>
      <span>{message}</span>
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Dismiss"
      >×</button>
    </div>
  );
}
