import Link from 'next/link';
import { ArrowLeft, FileText, Compass, ListChecks, Gauge, History, BookOpen, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

// ---------------------------------------------------------------------------
// Static showcase of this repo's agent-operability surface. Every item here
// already exists in the repository (AGENTS.md, CLAUDE.md, skills/, profiles/,
// evaluations/, runs/, docs/adr/, specs/) — this page doesn't add behavior,
// it makes that surface visible to a human or AI-recruiter visitor who would
// otherwise never open the GitHub repo to find it.
// ---------------------------------------------------------------------------

const REPO = 'https://github.com/prasad-kavuri/prasad-portfolio';

type ReadinessItem = {
  icon: typeof FileText;
  title: string;
  detail: string;
  href: string;
};

const CONTRACT_FILES: ReadinessItem[] = [
  {
    icon: FileText,
    title: 'AGENTS.md',
    detail: 'Universal, tool-agnostic agent contract — read by any coding agent (Codex, Cursor, Copilot, Claude Code) before touching this repo.',
    href: `${REPO}/blob/main/AGENTS.md`,
  },
  {
    icon: FileText,
    title: 'CLAUDE.md',
    detail: 'Claude Code-specific layer on top of AGENTS.md — demo execution modes, the Agent Operating Contract, and a "what not to do" list learned from past sessions.',
    href: `${REPO}/blob/main/CLAUDE.md`,
  },
  {
    icon: BookOpen,
    title: 'CONTEXT.md',
    detail: 'Canonical domain vocabulary (45+ terms) so any agent uses precise, consistent language instead of guessing.',
    href: `${REPO}/blob/main/CONTEXT.md`,
  },
  {
    icon: History,
    title: 'docs/adr/',
    detail: 'Architecture Decision Records — the why behind the most surprising choices in the codebase, written after the fact.',
    href: `${REPO}/tree/main/docs/adr`,
  },
  {
    icon: Compass,
    title: 'specs/',
    detail: 'Lightweight spec-before-code convention (inspired by GitHub Spec Kit) — what is about to be built and why, written before implementation.',
    href: `${REPO}/tree/main/specs`,
  },
];

const OPERATING_SURFACE: ReadinessItem[] = [
  {
    icon: ListChecks,
    title: 'skills/',
    detail: 'Runnable playbooks an agent can invoke by name: add a demo, run the full test suite, security review, agentic-SEO audit, recruiter/executive persona review, self-heal on a red CI run.',
    href: `${REPO}/tree/main/skills`,
  },
  {
    icon: Compass,
    title: 'profiles/',
    detail: 'Context-switching YAML files — which skills are active, which tools are permitted, and the focus area for a given session type (recruiter evaluation, testing, security audit, design).',
    href: `${REPO}/tree/main/profiles`,
  },
  {
    icon: Gauge,
    title: 'evaluations/',
    detail: 'Machine-readable quality gates per dimension — recruiter experience, security posture, agentic SEO, test health, accessibility, performance — each with a passing score, current score, and remediation steps.',
    href: `${REPO}/tree/main/evaluations`,
  },
  {
    icon: History,
    title: 'runs/',
    detail: 'Execution-trace directory — every significant skill run leaves a dated record, enabling measurement of agent reliability and regression rate over time.',
    href: `${REPO}/tree/main/runs`,
  },
];

function ItemCard({ item }: { item: ReadinessItem }) {
  const Icon = item.icon;
  return (
    <Card className="p-4">
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-3"
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--accent-brand)' }} aria-hidden="true" />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-semibold">{item.title}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
        </div>
      </a>
    </Card>
  );
}

export default function AgentReadinessPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back home
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="text-2xl font-bold sm:text-3xl">Agent Readiness</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        This repository is written to be read by coding agents, not just by people. Every file and
        directory below already exists in{' '}
        <a href={REPO} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          the public repo
        </a>{' '}
        — this page just surfaces it, since most visitors will never browse GitHub to find it.
      </p>

      <section className="mt-10" aria-labelledby="contract-heading">
        <h2 id="contract-heading" className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-brand)' }}>
          Agent Contract
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What a coding agent reads before it makes any change, and in what order.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CONTRACT_FILES.map((item) => (
            <ItemCard key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="surface-heading">
        <h2 id="surface-heading" className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-brand)' }}>
          Operating Surface
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Reusable playbooks, session profiles, quality gates, and traceability — so agent work on this
          repo is repeatable and measurable, not ad hoc.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {OPERATING_SURFACE.map((item) => (
            <ItemCard key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-lg border p-5 text-sm text-muted-foreground">
        <p>
          None of this is theoretical — the demos on this site, its ADRs, and this page itself were
          built and reviewed by coding agents operating under this exact contract. See{' '}
          <Link href="/governance" className="underline underline-offset-2 hover:text-foreground">
            Governance
          </Link>{' '}
          for the runtime safety controls (guardrails, rate limiting, evals) applied to the AI features
          this contract governs.
        </p>
      </section>
    </div>
  );
}
