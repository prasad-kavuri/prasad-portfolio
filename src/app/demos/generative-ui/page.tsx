'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenerativeUIRenderer } from '@/components/generative-ui/GenerativeUIRenderer';
import { generateClientTraceId, logAPIEvent } from '@/lib/observability';
import type { UiSpec } from '@/lib/generativeUiCatalog';

const EXAMPLES = [
  'Compare his two most recent roles',
  'Show his AI/ML skills',
  'Give me a timeline of his career',
];

type Phase = 'idle' | 'loading' | 'done' | 'error';

export default function GenerativeUIDemoPage() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [spec, setSpec] = useState<UiSpec | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function runQuery(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setPhase('loading');
    setErrorMessage('');
    const traceId = generateClientTraceId();
    try {
      const res = await fetch('/api/generative-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? 'Something went wrong.');
        setPhase('error');
        logAPIEvent({ event: 'demo.generative_ui_error', route: '/demos/generative-ui', severity: 'warn', traceId, status: res.status });
        return;
      }
      setSpec(data);
      setPhase('done');
      logAPIEvent({ event: 'demo.generative_ui_completed', route: '/demos/generative-ui', severity: 'info', traceId, status: 200 });
    } catch {
      setErrorMessage('Network error — please try again.');
      setPhase('error');
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/demos" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to demos
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="text-2xl font-bold sm:text-3xl">Constrained Generative UI</h1>
      <p className="mt-3 text-muted-foreground">
        Ask a question about Prasad&apos;s background. The model never writes markup — it can only emit
        JSON that names one of a small, fixed set of UI components with fixed prop shapes. The server
        validates that JSON against the catalog before returning it, and the renderer only ever draws
        known components. Anything that doesn&apos;t match the catalog is rejected server-side, never
        rendered.
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Pattern inspired by Vercel&apos;s json-render (AI → JSON → UI, constrained to a developer-defined
        catalog) — implemented here with this repo&apos;s existing schema-validation convention instead
        of a new dependency.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQuery(ex);
              void runQuery(ex);
            }}
            className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void runQuery(query);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={300}
          placeholder="Ask about his roles, skills, or career timeline…"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={phase === 'loading' || !query.trim()}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-brand)' }}
        >
          {phase === 'loading' ? <Loader className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Generate'}
        </button>
      </form>

      <div className="mt-8">
        {phase === 'error' && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}
        {phase === 'done' && spec && <GenerativeUIRenderer spec={spec} />}
      </div>
    </div>
  );
}
