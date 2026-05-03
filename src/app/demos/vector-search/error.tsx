'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DemoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[demo-error]', error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <p className="text-sm text-muted-foreground">This demo encountered an error</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/40"
        >
          Try again
        </button>
        <Link
          href="/demos"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/40"
        >
          ← Back to demos
        </Link>
      </div>
    </div>
  );
}
