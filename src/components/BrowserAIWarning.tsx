'use client';

import { BrowserAIStatus } from '@/hooks/useBrowserAI';

interface Props {
  status: BrowserAIStatus;
  demoName?: string;
}

export function BrowserAIWarning({ status, demoName }: Props) {
  if (!status.warningTitle) return null;
  const isHard = !status.shouldAttemptLoad;

  return (
    <div role="alert" className={`mb-6 flex items-start gap-3 rounded-lg border p-4 ${
      isHard ? 'border-amber-500/30 bg-amber-500/10' : 'border-yellow-500/20 bg-yellow-500/5'
    }`}>
      <svg xmlns="http://www.w3.org/2000/svg"
        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${isHard ? 'text-amber-400' : 'text-yellow-400'}`}
        viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
      </svg>
      <div>
        <p className={`text-sm font-medium ${isHard ? 'text-amber-300' : 'text-yellow-300'}`}>
          {status.warningTitle}
        </p>
        {status.warningDetail && (
          <p className={`mt-1 text-xs ${isHard ? 'text-amber-400/80' : 'text-yellow-400/60'}`}>
            {status.warningDetail}
          </p>
        )}
        {isHard && (
          <p className="mt-2 text-xs text-slate-400">
            ↓ Full simulated {demoName ?? 'demo'} walkthrough shown below.
          </p>
        )}
      </div>
    </div>
  );
}
