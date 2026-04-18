'use client';
import type { ExecutionState } from '@/hooks/useExecutionStrategy';

interface Props {
  state: ExecutionState;
  demoName?: string;
  fallbackMessage?: string;
}

export function CapabilityNotice({ state, demoName, fallbackMessage }: Props) {
  if (!state.isReady || state.mode === 'local') return null;

  const isCloud = state.mode === 'cloud';
  const isHybrid = state.mode === 'hybrid';

  if (isHybrid) return null; // Hybrid starts local — no notice needed upfront

  const border = isCloud
    ? 'border-blue-500/20 bg-blue-500/5'
    : 'border-amber-500/30 bg-amber-500/10';
  const titleCls = isCloud ? 'text-blue-300' : 'text-amber-300';
  const detailCls = isCloud ? 'text-blue-400/70' : 'text-amber-400/70';

  const title = isCloud
    ? 'Optimized for your device — Cloud AI active'
    : `${demoName ?? 'Demo'}: Simulated walkthrough`;

  const detail = fallbackMessage ?? (isCloud
    ? 'On-device inference is not available on this device. Routed to high-speed cloud API. All guardrails active.'
    : 'Live model inference requires a desktop browser. A full simulated walkthrough is shown below.');

  return (
    <div role="status" aria-live="polite"
      className={`mb-5 flex items-start gap-3 rounded-lg border p-4 ${border}`}>
      <svg xmlns="http://www.w3.org/2000/svg"
        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${isCloud ? 'text-blue-400' : 'text-amber-400'}`}
        viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        {isCloud
          ? <path d="M5.5 16a3.5 3.5 0 01-.369-6.98A4 4 0 1113.5 9H14a3 3 0 010 6H5.5z"/>
          : <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
        }
      </svg>
      <div>
        <p className={`text-sm font-medium ${titleCls}`}>{title}</p>
        <p className={`mt-1 text-xs ${detailCls}`}>{detail}</p>
        {!isCloud && (
          <p className="mt-2 text-xs text-slate-500">↓ Full walkthrough shown below.</p>
        )}
      </div>
    </div>
  );
}
