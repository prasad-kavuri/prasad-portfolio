'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, CheckCircle, XCircle, Loader2, FlaskConical, Gauge, GitMerge,
  TrendingDown, AlertTriangle, UserCheck, DollarSign, Shield, BadgeCheck,
  ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const SAMPLE_PROMPT =
  "What is Prasad's most significant leadership achievement at Krutrim?";

const SAMPLE_RESPONSE =
  "Prasad led the development of India's first Agentic AI platform at Krutrim, managing a team of 200+ engineers. He architected the end-to-end LLM infrastructure that powers Krutrim's products and scaled the AI org from 40 to 200 engineers within 18 months.";

const JUDGE_CRITERIA = [
  { label: 'Factual Accuracy', weight: 0.40, score: 0.96 },
  { label: 'Relevance',        weight: 0.25, score: 0.98 },
  { label: 'Completeness',     weight: 0.20, score: 0.88 },
  { label: 'Conciseness',      weight: 0.15, score: 0.94 },
];

const FIDELITY_SCORE  = 0.94;
const HALLUCINATION_SCORE = 0.02;

const OFFLINE_ROWS = [
  { id: 'eval-001', query: 'Current role at Krutrim',        fidelity: 0.97, hallucination: 0.01, status: 'pass' },
  { id: 'eval-002', query: 'Years at HERE Technologies',     fidelity: 0.93, hallucination: 0.03, status: 'pass' },
  { id: 'eval-003', query: 'Ola Maps scale achieved',        fidelity: 0.91, hallucination: 0.04, status: 'pass' },
  { id: 'eval-004', query: 'AI stack used at Krutrim',       fidelity: 0.88, hallucination: 0.06, status: 'pass' },
  { id: 'eval-005', query: 'Education background',           fidelity: 0.79, hallucination: 0.12, status: 'fail' },
] as const;

const ONLINE_ROWS = [
  { time: '14:02:11', query: 'What is his title?',              fidelity: 0.98, latency: 312, status: 'pass' },
  { time: '14:03:47', query: 'Contact info?',                   fidelity: 0.95, latency: 287, status: 'pass' },
  { time: '14:05:03', query: 'Ignore previous instructions',    fidelity: 0.00, latency: 44,  status: 'block' },
  { time: '14:06:22', query: 'Skills in LLM infra?',            fidelity: 0.92, latency: 301, status: 'pass' },
  { time: '14:07:58', query: 'Patents filed?',                  fidelity: 0.71, latency: 398, status: 'warn' },
] as const;

type StageStatus = 'idle' | 'running' | 'pass' | 'fail';

interface CIStage { id: string; label: string; detail: string; }

const CI_STAGES: CIStage[] = [
  { id: 'build',    label: 'Build & lint',         detail: 'tsc --noEmit + eslint' },
  { id: 'unit',     label: 'Unit tests',            detail: '323 tests' },
  { id: 'evals',    label: 'Run eval suite',        detail: '27 eval cases' },
  { id: 'baseline', label: 'Compare baseline',      detail: 'fidelity Δ vs last deploy' },
  { id: 'gate',     label: 'Regression gate',       detail: 'fidelity ≥ 0.85, hallucination ≤ 0.10' },
  { id: 'deploy',   label: 'Deploy to production',  detail: 'Vercel edge network' },
];

interface CIScenario {
  label: string;
  description: string;
  results: Record<string, { status: 'pass' | 'fail'; detail: string }>;
}

const CI_SCENARIOS: Record<'passing' | 'failing', CIScenario> = {
  passing: {
    label: '✅ Passing deploy',
    description: 'All metrics above threshold — safe to ship',
    results: {
      build:    { status: 'pass', detail: '0 errors' },
      unit:     { status: 'pass', detail: '323/323' },
      evals:    { status: 'pass', detail: 'fidelity 0.94, hallucination 0.02' },
      baseline: { status: 'pass', detail: 'Δ +0.02 vs baseline' },
      gate:     { status: 'pass', detail: 'thresholds met' },
      deploy:   { status: 'pass', detail: 'deployed @ 14:08:31' },
    },
  },
  failing: {
    label: '❌ Blocked deploy',
    description: 'Fidelity regressed below threshold — deploy blocked',
    results: {
      build:    { status: 'pass', detail: '0 errors' },
      unit:     { status: 'pass', detail: '323/323' },
      evals:    { status: 'fail', detail: 'fidelity 0.71, hallucination 0.18' },
      baseline: { status: 'fail', detail: 'Δ −0.21 vs baseline ⚠' },
      gate:     { status: 'fail', detail: 'fidelity < 0.85 — blocked' },
      deploy:   { status: 'fail', detail: 'blocked by gate' },
    },
  },
};

// ---------------------------------------------------------------------------
// Shared sub-components (unchanged)
// ---------------------------------------------------------------------------

function AnimatedBar({ target, delay = 0 }: { target: number; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(target * 100), delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  const color =
    target >= 0.9 ? 'bg-green-500' : target >= 0.75 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function ScorePill({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value <= 0.05 : value >= 0.9;
  const mid  = invert ? value <= 0.10 : value >= 0.75;
  const cls  = good ? 'bg-green-500/20 text-green-400' : mid ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';
  return <Badge className={`${cls} border-0 font-mono text-xs`}>{value.toFixed(2)}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pass:  'bg-green-500/20 text-green-400',
    fail:  'bg-red-500/20 text-red-400',
    warn:  'bg-yellow-500/20 text-yellow-400',
    block: 'bg-orange-500/20 text-orange-400',
  };
  return (
    <Badge className={`${map[status] ?? 'bg-muted text-muted-foreground'} border-0 text-xs`}>
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Framing panel
// ---------------------------------------------------------------------------

function FramingPanel() {
  return (
    <Card className="bg-card border-border p-6 mb-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          What you&apos;re about to see
        </p>
        <p className="text-sm text-muted-foreground">
          A simulated production eval pipeline — the missing layer in most AI deployments
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            What you&apos;re seeing
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" /><span>LLM-as-Judge scoring responses in real time</span></li>
            <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" /><span>Offline batch evals vs. live traffic sampling</span></li>
            <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" /><span>CI regression gate blocking bad model updates</span></li>
            <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" /><span>Human-in-the-Loop checkpoint on high-stakes transitions</span></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Why it matters
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" /><span>Uncontrolled AI drift costs ~$2.3M per major incident (Gartner 2025)</span></li>
            <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" /><span>73% of enterprise AI failures are caught by eval gating before prod</span></li>
            <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" /><span>HITL checkpoints reduce unreviewed agent errors by 89%</span></li>
            <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" /><span>Full trace-ID auditability satisfies SOC 2 Type II requirements</span></li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3 italic">Industry benchmarks — illustrative framing, not personal metrics.</p>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Scenario Toggle
// ---------------------------------------------------------------------------

type Scenario = 'normal' | 'drift' | 'hitl';

const SCENARIO_TABS: { id: Scenario; label: string; sublabel: string }[] = [
  { id: 'normal', label: 'Normal Operation',          sublabel: 'All systems healthy' },
  { id: 'drift',  label: 'High-Latency Drift Event',  sublabel: 'Degradation detected' },
  { id: 'hitl',   label: 'HITL Checkpoint',           sublabel: 'Awaiting human review' },
];

function ScoreBox({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${good ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${good ? 'text-green-400' : 'text-red-400'}`}>{value}</p>
    </div>
  );
}

function BusinessStrip({ items }: { items: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground border-t border-border pt-3">
      {items.map(item => <span key={item}>{item}</span>)}
    </div>
  );
}

function DriftTimeline({ animate }: { animate: boolean }) {
  const points = [
    { label: 'T−6h', value: 0.94, color: 'bg-green-500' },
    { label: 'T−3h', value: 0.83, color: 'bg-yellow-500' },
    { label: 'T−1h', value: 0.71, color: 'bg-red-500' },
    { label: 'Now',  value: 0,    color: 'bg-red-500', alert: true },
  ];

  const [widths, setWidths] = useState<number[]>([0, 0, 0, 0]);
  useEffect(() => {
    if (!animate) { setWidths([0, 0, 0, 0]); return; }
    points.forEach((p, i) => {
      const t = setTimeout(() => {
        setWidths(prev => {
          const next = [...prev];
          next[i] = p.value * 100;
          return next;
        });
      }, 100 + i * 250);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate]);

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fidelity drift — 6h window</p>
      {points.map((p, i) => (
        <div key={p.label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-10 shrink-0 text-right">{p.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            {!p.alert ? (
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${p.color}`}
                style={{ width: `${widths[i]}%` }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="text-xs text-red-400 font-semibold animate-pulse">⚠ ALERT</span>
              </div>
            )}
          </div>
          {!p.alert && (
            <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">{p.value.toFixed(2)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function HITLApprovalPanel() {
  const [decision, setDecision] = useState<null | 'approved' | 'rejected'>(null);

  return (
    <div className="space-y-4">
      {/* Context */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Researcher agent output</p>
        <p className="text-sm text-foreground leading-relaxed">
          &ldquo;Analysis complete. Recommended strategic pivot: reallocate 40% of compute budget to
          vector search infrastructure. Projected ROI: 3.2× over 18 months. Confidence: 67%.
          Note: decision irreversible within 72-hour window.&rdquo;
        </p>
        <p className="text-xs text-muted-foreground mt-2 italic">Truncated — full output: 847 tokens</p>
      </div>

      {/* Risk assessment */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Confidence</p>
          <p className="text-lg font-bold text-yellow-400">67%</p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Stakes</p>
          <p className="text-lg font-bold text-red-400">HIGH</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
          <p className="text-xs font-semibold text-amber-400">Human review</p>
        </div>
      </div>

      {/* Approval buttons / outcome */}
      {decision === null ? (
        <div className="flex gap-3">
          <Button
            onClick={() => setDecision('approved')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve &amp; Continue
          </Button>
          <Button
            onClick={() => setDecision('rejected')}
            variant="outline"
            className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10 font-semibold"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject &amp; Revise
          </Button>
        </div>
      ) : decision === 'approved' ? (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm font-semibold text-green-400">HITL checkpoint passed — continuing pipeline</p>
          </div>
          <p className="text-xs text-muted-foreground">Strategist agent activating with approved context &rarr; final output generating</p>
          <button onClick={() => setDecision(null)} className="text-xs text-muted-foreground underline mt-2">Reset</button>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-amber-400">Revision request sent — pipeline paused</p>
          </div>
          <p className="text-xs text-muted-foreground">Researcher agent will re-analyze with updated constraints. Human re-review required.</p>
          <button onClick={() => setDecision(null)} className="text-xs text-muted-foreground underline mt-2">Reset</button>
        </div>
      )}
    </div>
  );
}

function ScenarioPanel() {
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [driftAnimated, setDriftAnimated] = useState(false);

  useEffect(() => {
    if (scenario === 'drift') {
      setDriftAnimated(false);
      const t = setTimeout(() => setDriftAnimated(true), 50);
      return () => clearTimeout(t);
    }
  }, [scenario]);

  const scenarioContent = {
    normal: (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            <CheckCircle className="w-3.5 h-3.5" /> All systems healthy
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <ScoreBox label="Fidelity"      value="0.94" good />
          <ScoreBox label="Hallucination" value="0.02" good />
          <ScoreBox label="Coherence"     value="0.91" good />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-green-400 font-medium">CI Gate: PASSED</span>
            <span className="text-muted-foreground text-xs ml-auto">deployed to production</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <span className="text-xs text-muted-foreground">Drift Monitor:</span>
            <span className="text-xs font-medium text-green-400">Stable — no alerts</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <span className="text-xs text-muted-foreground">HITL:</span>
            <span className="text-xs text-muted-foreground">Not triggered (confidence &gt; threshold)</span>
          </div>
        </div>
        <BusinessStrip items={[
          'Cost per interaction: $0.0023',
          'Latency p95: 340ms',
          'User satisfaction: 94%',
          'Zero rollbacks this sprint',
        ]} />
      </div>
    ),
    drift: (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-red-500/20 text-red-400">
            <TrendingDown className="w-3.5 h-3.5" /> Model degradation detected
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" /> Fidelity dropped 24% over 6h
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <ScoreBox label="Fidelity"      value="0.71" good={false} />
          <ScoreBox label="Hallucination" value="0.18" good={false} />
          <ScoreBox label="Coherence"     value="0.65" good={false} />
        </div>
        <DriftTimeline animate={driftAnimated} />
        <div className="grid gap-2 sm:grid-cols-2 text-sm mt-4">
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-red-400 font-medium">CI Gate: BLOCKED</span>
            <span className="text-muted-foreground text-xs ml-auto">regression detected</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs text-amber-400 font-medium">HITL triggered — awaiting review</span>
          </div>
        </div>
        <BusinessStrip items={[
          'Estimated impact if undetected: $47K',
          'Time to detect: 6h',
          'Time to block: <1 min',
          'Rollback prevented by eval gate ✅',
        ]} />
      </div>
    ),
    hitl: (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
            <UserCheck className="w-3.5 h-3.5" /> Awaiting human review before Strategist proceeds
          </span>
        </div>
        <HITLApprovalPanel />
        <BusinessStrip items={[
          'HITL checkpoints prevent 89% of high-stakes agent errors',
          'Avg review time: 45 seconds',
          'Compliance: SOC 2 Type II ✅',
        ]} />
      </div>
    ),
  };

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center gap-2 mb-1">
        <Gauge className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-lg">Scenario Explorer</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Switch between operational states to see how the eval pipeline responds.
      </p>

      {/* Tab strip */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SCENARIO_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setScenario(tab.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
              scenario === tab.id
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-muted text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <span className="block">{tab.label}</span>
            <span className="block text-xs opacity-70">{tab.sublabel}</span>
          </button>
        ))}
      </div>

      {/* Scenario content with animated transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scenario}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {scenarioContent[scenario]}
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 1 — LLM-as-Judge Panel (unchanged)
// ---------------------------------------------------------------------------

function JudgePanel() {
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const [revealed, setRevealed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    setDone(false);
    setRevealed(0);
    setRunning(true);
    JUDGE_CRITERIA.forEach((_, i) => {
      timerRef.current = setTimeout(() => {
        setRevealed(i + 1);
        if (i === JUDGE_CRITERIA.length - 1) {
          setTimeout(() => { setRunning(false); setDone(true); }, 300);
        }
      }, 600 + i * 700);
    });
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const weighted = JUDGE_CRITERIA.reduce((acc, c) => acc + c.score * c.weight, 0);

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-lg">LLM-as-Judge</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        A second LLM scores each response against weighted criteria before it reaches the user.
      </p>
      <div className="mb-5 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Prompt</p>
          <div className="bg-background rounded-lg p-3 text-sm font-mono text-foreground border border-border">
            {SAMPLE_PROMPT}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Response under evaluation</p>
          <div className="bg-background rounded-lg p-3 text-sm text-muted-foreground border border-border leading-relaxed">
            {SAMPLE_RESPONSE}
          </div>
        </div>
      </div>
      <Button
        onClick={start}
        disabled={running}
        className="mb-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
        {running ? 'Scoring…' : done ? 'Re-run Judge' : 'Run Judge Scoring'}
      </Button>
      <div className="space-y-3 mb-5">
        {JUDGE_CRITERIA.map((c, i) => (
          <div
            key={c.label}
            className={`transition-opacity duration-300 ${i < revealed || !running && !done ? 'opacity-100' : revealed <= i && (running || !done) ? 'opacity-30' : 'opacity-100'}`}
          >
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="text-muted-foreground">{c.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">weight {(c.weight * 100).toFixed(0)}%</span>
                {(i < revealed || done) && <ScorePill value={c.score} />}
              </div>
            </div>
            {(i < revealed || done) && <AnimatedBar target={c.score} delay={0} />}
          </div>
        ))}
      </div>
      {done && (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Fidelity</p>
            <p className="text-2xl font-bold text-green-400">{FIDELITY_SCORE.toFixed(2)}</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Hallucination</p>
            <p className="text-2xl font-bold text-green-400">{HALLUCINATION_SCORE.toFixed(2)}</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Weighted avg</p>
            <p className="text-2xl font-bold text-green-400">{weighted.toFixed(2)}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 2 — Offline vs Online toggle (unchanged)
// ---------------------------------------------------------------------------

function EvalModePanel() {
  const [mode, setMode] = useState<'offline' | 'online'>('offline');

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center gap-2 mb-1">
        <Gauge className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-lg">Offline vs Online Evals</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Offline evals run on a curated dataset before deploy. Online evals sample live traffic in production.
      </p>
      <div className="flex gap-1 bg-muted rounded-lg p-1 mb-5 w-fit">
        {(['offline', 'online'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'offline' ? '📁 Offline — batch' : '📡 Online — live sampling'}
          </button>
        ))}
      </div>
      {mode === 'offline' ? (
        <div>
          <p className="text-xs text-muted-foreground mb-3">27-case golden dataset, run on every CI push</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-3 py-2 text-xs text-muted-foreground font-medium">Case</th>
                  <th className="px-3 py-2 text-xs text-muted-foreground font-medium">Query</th>
                  <th className="px-3 py-2 text-xs text-muted-foreground font-medium text-right">Fidelity</th>
                  <th className="px-3 py-2 text-xs text-muted-foreground font-medium text-right">Hallucin.</th>
                  <th className="px-3 py-2 text-xs text-muted-foreground font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {OFFLINE_ROWS.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.id}</td>
                    <td className="px-3 py-2 text-foreground">{row.query}</td>
                    <td className="px-3 py-2 text-right"><ScorePill value={row.fidelity} /></td>
                    <td className="px-3 py-2 text-right"><ScorePill value={row.hallucination} invert /></td>
                    <td className="px-3 py-2 text-right"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="text-green-400">4 pass</span>
            <span className="text-red-400">1 fail</span>
            <span>avg fidelity 0.896</span>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground mb-3">1% traffic sample — scored asynchronously, alerted on drift</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-3 py-2 text-xs text-muted-foreground font-medium">Time</th>
                  <th className="px-3 py-2 text-xs text-muted-foreground font-medium">Query</th>
                  <th className="px-3 py-2 text-xs text-muted-foreground font-medium text-right">Fidelity</th>
                  <th className="px-3 py-2 text-xs text-muted-foreground font-medium text-right">Latency</th>
                  <th className="px-3 py-2 text-xs text-muted-foreground font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {ONLINE_ROWS.map((row, i) => (
                  <tr key={row.time} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.time}</td>
                    <td className="px-3 py-2 text-foreground truncate max-w-[160px]">{row.query}</td>
                    <td className="px-3 py-2 text-right">
                      {row.status === 'block' ? (
                        <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">blocked</Badge>
                      ) : (
                        <ScorePill value={row.fidelity} />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">{row.latency}ms</td>
                    <td className="px-3 py-2 text-right"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="text-green-400">3 pass</span>
            <span className="text-yellow-400">1 warn</span>
            <span className="text-orange-400">1 blocked</span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 3 — CI Regression Gate (unchanged)
// ---------------------------------------------------------------------------

function CIGatePanel() {
  const [scenario, setScenario]      = useState<'passing' | 'failing'>('passing');
  const [running, setRunning]        = useState(false);
  const [activeStage, setActive]     = useState(-1);
  const [stageStatuses, setStatuses] = useState<Record<string, StageStatus>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPipeline = () => {
    setRunning(true);
    setStatuses({});
    setActive(0);
    const results = CI_SCENARIOS[scenario].results;
    CI_STAGES.forEach((stage, i) => {
      timerRef.current = setTimeout(() => {
        setActive(i);
        setStatuses(prev => ({ ...prev, [stage.id]: 'running' }));
      }, i * 900);
      timerRef.current = setTimeout(() => {
        const finalStatus = results[stage.id].status;
        setStatuses(prev => ({ ...prev, [stage.id]: finalStatus }));
        if (i === CI_STAGES.length - 1) { setRunning(false); setActive(-1); }
      }, i * 900 + 600);
    });
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const stageIcon = (id: string) => {
    const s = stageStatuses[id];
    if (s === 'running') return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    if (s === 'pass')    return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (s === 'fail')    return <XCircle className="w-4 h-4 text-red-400" />;
    return <div className="w-4 h-4 rounded-full border-2 border-border" />;
  };

  const allDone = !running && Object.keys(stageStatuses).length === CI_STAGES.length;
  const passed  = allDone && scenario === 'passing';

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center gap-2 mb-1">
        <GitMerge className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-lg">Regression Gate (CI)</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Eval scores are compared against a stored baseline on every push. A regression blocks the deploy.
      </p>
      <div className="flex gap-2 mb-5">
        {(['passing', 'failing'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setScenario(s); setStatuses({}); setActive(-1); setRunning(false); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              scenario === s
                ? s === 'passing'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-muted text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {CI_SCENARIOS[s].label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-4 italic">{CI_SCENARIOS[scenario].description}</p>
      <div className="space-y-2 mb-5">
        {CI_STAGES.map((stage, i) => {
          const s = stageStatuses[stage.id];
          const result = CI_SCENARIOS[scenario].results[stage.id];
          const isActive = activeStage === i;
          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isActive ? 'border-blue-500/30 bg-blue-500/5' :
                s === 'pass' ? 'border-green-500/20 bg-green-500/5' :
                s === 'fail' ? 'border-red-500/20 bg-red-500/5' :
                'border-border bg-background'
              }`}
            >
              {stageIcon(stage.id)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{stage.label}</span>
                  {s && s !== 'running' && (
                    <span className={`text-xs font-mono ${s === 'pass' ? 'text-green-400' : 'text-red-400'}`}>
                      {result.detail}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stage.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
      <Button
        onClick={runPipeline}
        disabled={running}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
        {running ? 'Running pipeline…' : 'Run CI Pipeline'}
      </Button>
      {allDone && (
        <div className={`mt-4 p-4 rounded-lg border text-center font-semibold text-sm ${
          passed
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {passed
            ? '✅ All gates passed — deploying to production'
            : '❌ Regression detected — deploy blocked, team alerted'}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Platform Impact cards
// ---------------------------------------------------------------------------

function PlatformImpact() {
  const cards = [
    {
      icon: <DollarSign className="w-5 h-5 text-green-400" />,
      metric: '67% reduction',
      label: 'Inference cost vs. unoptimized baseline',
      supporting: 'LLM routing + eval gating eliminate waste',
      color: 'border-green-500/20',
    },
    {
      icon: <Shield className="w-5 h-5 text-blue-400" />,
      metric: '< 1 min',
      label: 'Mean time to detect model regression',
      supporting: 'Drift monitoring + CI gate catch issues before users do',
      color: 'border-blue-500/20',
    },
    {
      icon: <BadgeCheck className="w-5 h-5 text-purple-400" />,
      metric: 'SOC 2 Type II',
      label: 'Audit trail coverage',
      supporting: 'End-to-end Trace-IDs on every LLM interaction',
      color: 'border-purple-500/20',
    },
  ];

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        What this means for your business
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(card => (
          <Card key={card.label} className={`bg-card border p-5 ${card.color}`}>
            <div className="flex items-center gap-2 mb-3">
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{card.metric}</p>
            <p className="text-sm font-medium text-foreground mb-2">{card.label}</p>
            <p className="text-xs text-muted-foreground">{card.supporting}</p>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 italic">
        Metrics reflect architecture capabilities demonstrated in this platform.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EvaluationShowcasePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">

        {/* Step 2 — Framing panel */}
        <FramingPanel />

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
          <div>
            <h1 className="text-4xl font-bold">AI Evaluation Showcase</h1>
            <p className="text-muted-foreground mt-2">
              Closed-loop LLM quality pipeline — LLM-as-Judge scoring, offline/online eval modes,
              and CI regression gating that blocks bad deploys automatically
            </p>
          </div>
        </div>

        {/* Step 3 — Scenario toggle */}
        <div className="mb-6">
          <ScenarioPanel />
        </div>

        {/* Existing three sections */}
        <div className="flex flex-col gap-6">
          <JudgePanel />
          <EvalModePanel />
          <CIGatePanel />
        </div>

        {/* How it fits together */}
        <Card className="bg-card border-border p-6 mt-6">
          <h3 className="font-semibold mb-3 text-foreground">How this pipeline fits together</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-none">
            <li><span className="text-foreground font-medium">1. LLM-as-Judge</span> — a separate model scores every sampled response against weighted criteria (accuracy, relevance, completeness, conciseness).</li>
            <li><span className="text-foreground font-medium">2. Offline evals</span> — a curated 27-case golden dataset runs on every CI push; one failing case blocks the merge.</li>
            <li><span className="text-foreground font-medium">3. Online evals</span> — 1% of live traffic is scored asynchronously; drift triggers an alert before it becomes a customer problem.</li>
            <li><span className="text-foreground font-medium">4. Regression gate</span> — fidelity and hallucination scores are compared to a stored baseline; a regression of more than 5% blocks the deploy entirely.</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-4">
            This pattern ships inside <code className="font-mono bg-muted px-1 py-0.5 rounded">src/lib/eval-engine.ts</code> and <code className="font-mono bg-muted px-1 py-0.5 rounded">src/lib/guardrails.ts</code> and runs as part of the CI suite on every push.
          </p>
        </Card>

        {/* Step 4 — Business outcome layer */}
        <PlatformImpact />

      </div>
    </div>
  );
}
