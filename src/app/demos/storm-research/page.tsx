'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, RotateCcw, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { generateClientTraceId } from '@/lib/observability';

// ── Types ────────────────────────────────────────────────────────────────────

type StormMsg =
  | { type: 'phase'; phase: string; label: string }
  | { type: 'perspectives'; data: string[] }
  | { type: 'questions'; data: Record<string, string[]> }
  | { type: 'answers'; perspective: string; data: Array<{ question: string; answer: string }> }
  | { type: 'report'; data: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

type RunPhase = 'perspectives' | 'questions' | 'research' | 'synthesis';

interface AnswerSet {
  question: string;
  answer: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EXAMPLE_CHIPS = [
  'Anthropic', 'Agentic AI Systems', 'LLM Routing', 'AI Governance',
  'Zip AI Strategy', 'OpenAI', 'Stripe AI Platform',
];

const PHASE_LABELS: Record<RunPhase, string> = {
  perspectives: 'Discovering Perspectives',
  questions: 'Generating Questions',
  research: 'Researching',
  synthesis: 'Synthesizing Report',
};

const PHASE_ORDER: RunPhase[] = ['perspectives', 'questions', 'research', 'synthesis'];

// ── Simple markdown renderer (safe — no dangerouslySetInnerHTML) ──────────────

function ReportView({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm text-foreground leading-relaxed">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="text-base font-semibold mt-4 first:mt-0" style={{ color: 'var(--accent-brand)' }}>
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={i} className="text-lg font-bold mt-2 first:mt-0">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <p key={i} className="pl-4 text-muted-foreground">
              {'• '}{line.slice(2)}
            </p>
          );
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={i} className="font-semibold">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} className="text-muted-foreground">{line}</p>;
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function StormResearchPage() {
  const [topic, setTopic] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Phase tracking
  const [activePhase, setActivePhase] = useState<RunPhase | null>(null);
  const [completedPhases, setCompletedPhases] = useState<Set<RunPhase>>(new Set());

  // Results
  const [perspectives, setPerspectives] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Record<string, string[]>>({});
  const [answers, setAnswers] = useState<Record<string, AnswerSet[]>>({});
  const [report, setReport] = useState('');
  const [expandedPerspective, setExpandedPerspective] = useState<string | null>(null);

  const traceId = useRef(generateClientTraceId());

  const reset = () => {
    setIsRunning(false);
    setIsDone(false);
    setError('');
    setCopied(false);
    setActivePhase(null);
    setCompletedPhases(new Set());
    setPerspectives([]);
    setQuestions({});
    setAnswers({});
    setReport('');
    setExpandedPerspective(null);
    traceId.current = generateClientTraceId();
  };

  const handleRun = async () => {
    const cleanTopic = topic.trim();
    if (!cleanTopic) { setError('Please enter a topic'); return; }
    reset();
    setTopic(cleanTopic);
    setIsRunning(true);
    setError('');

    try {
      const response = await fetch('/api/storm-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Trace-Id': traceId.current },
        body: JSON.stringify({ topic: cleanTopic }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error((data as { error?: string }).error ?? 'Request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line) as StormMsg;

            if (msg.type === 'phase') {
              const phase = msg.phase as RunPhase;
              setActivePhase(phase);
              setCompletedPhases(prev => {
                const idx = PHASE_ORDER.indexOf(phase);
                const done = new Set(prev);
                PHASE_ORDER.slice(0, idx).forEach(p => done.add(p));
                return done;
              });
            } else if (msg.type === 'perspectives') {
              setPerspectives(msg.data);
              setExpandedPerspective(msg.data[0] ?? null);
            } else if (msg.type === 'questions') {
              setQuestions(msg.data);
            } else if (msg.type === 'answers') {
              setAnswers(prev => ({ ...prev, [msg.perspective]: msg.data }));
            } else if (msg.type === 'report') {
              setReport(msg.data);
            } else if (msg.type === 'done') {
              setCompletedPhases(new Set(PHASE_ORDER));
              setActivePhase(null);
              setIsDone(true);
            } else if (msg.type === 'error') {
              throw new Error(msg.message);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'STORM Research Agent',
    description: 'Multi-perspective AI research demo inspired by Stanford STORM.',
    url: 'https://www.prasadkavuri.com/demos/storm-research',
    author: { '@type': 'Person', '@id': 'https://www.prasadkavuri.com/#person', name: 'Prasad Kavuri' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div className="border-b border-border p-4 sticky top-0 z-10 bg-background">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="hover:bg-card p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
          <div>
            <h1 className="text-xl font-bold">STORM Research Agent</h1>
            <p className="text-xs text-muted-foreground">
              Multi-perspective AI research · Inspired by Stanford STORM
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">

        {/* Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={e => { setTopic(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter' && !isRunning) void handleRun(); }}
              placeholder="Enter a topic, company, or technology..."
              maxLength={200}
              disabled={isRunning}
              className="flex-1 px-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 disabled:opacity-50 text-sm"
            />
            {(isRunning || isDone) && (
              <button
                onClick={reset}
                className="px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => void handleRun()}
              disabled={isRunning || !topic.trim()}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isRunning ? <><Loader className="w-4 h-4 animate-spin" />Running</> : 'Research'}
            </button>
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => { setTopic(chip); setError(''); }}
                disabled={isRunning}
                className="px-3 py-1 rounded-full text-xs border border-border bg-muted hover:bg-card disabled:opacity-50 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Phase progress */}
        {(isRunning || isDone) && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-0">
              {PHASE_ORDER.map((phase, idx) => {
                const isComplete = completedPhases.has(phase);
                const isActive = activePhase === phase;
                return (
                  <div key={phase} className="flex items-center flex-1 min-w-0">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      isActive ? 'bg-blue-500/20 text-blue-400' :
                      isComplete ? 'text-green-400' : 'text-muted-foreground'
                    }`}>
                      {isActive && <Loader className="w-3 h-3 animate-spin shrink-0" />}
                      {isComplete && !isActive && <span className="text-green-400">✓</span>}
                      <span className="truncate">{PHASE_LABELS[phase]}</span>
                    </div>
                    {idx < PHASE_ORDER.length - 1 && (
                      <div className={`h-px flex-1 mx-1 ${isComplete ? 'bg-green-500/40' : 'bg-border'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Perspectives */}
        {perspectives.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Expert Perspectives</p>
            <div className="space-y-2">
              {perspectives.map(p => {
                const isExpanded = expandedPerspective === p;
                const perspAnswers = answers[p];
                const perspQuestions = questions[p];
                return (
                  <div key={p} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedPerspective(isExpanded ? null : p)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{p}</span>
                        {perspAnswers && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            Researched
                          </span>
                        )}
                        {!perspAnswers && perspQuestions && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {perspQuestions.length} questions
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                        {perspAnswers ? (
                          perspAnswers.map((qa, i) => (
                            <div key={i} className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">{qa.question}</p>
                              <p className="text-sm text-foreground leading-relaxed">{qa.answer}</p>
                            </div>
                          ))
                        ) : perspQuestions ? (
                          <div className="space-y-1">
                            {perspQuestions.map((q, i) => (
                              <p key={i} className="text-xs text-muted-foreground flex gap-2">
                                <span className="shrink-0 text-blue-400">{i + 1}.</span>
                                <span>{q}</span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Generating questions...</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Executive Brief</p>
              <button
                onClick={() => void handleCopy()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-card border border-border text-xs font-medium transition-colors"
              >
                {copied ? <><Check className="w-3.5 h-3.5 text-green-400" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy Report</>}
              </button>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <ReportView text={report} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isRunning && !isDone && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
            <p className="text-sm">Enter a topic above to start a multi-perspective research session.</p>
            <p className="text-xs mt-1 opacity-70">Try: &quot;Anthropic&quot; · &quot;Agentic AI Systems&quot; · &quot;AI Governance&quot;</p>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="border-t border-border mt-12 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by Groq · Llama 3.3 70B · Inspired by{' '}
            <a
              href="https://github.com/stanford-oval/storm"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Stanford STORM
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
