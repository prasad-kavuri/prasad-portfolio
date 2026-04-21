import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Download, ExternalLink, Calendar } from 'lucide-react';
import { EXECUTIVE_METRICS } from '@/lib/executive-metrics';

export const metadata: Metadata = {
  title: 'For Recruiters',
  description:
    'Executive recruiter brief for VP/Head AI Platform and AI Engineering role matching, with capability map, demos, governance, and certification evidence.',
  alternates: {
    canonical: 'https://www.prasadkavuri.com/for-recruiters',
  },
  openGraph: {
    title: 'For Recruiters — Prasad Kavuri',
    description:
      'Executive summary and guided review path for VP / Head / Senior Director AI Platform conversations.',
    url: 'https://www.prasadkavuri.com/for-recruiters',
    images: [{ url: 'https://www.prasadkavuri.com/og-image.jpg', width: 1200, height: 630, alt: 'Prasad Kavuri recruiter page' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Recruiters — Prasad Kavuri',
    description: 'Recruiter path across capabilities, demos, governance, and certifications.',
    images: ['https://www.prasadkavuri.com/og-image.jpg'],
  },
};

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function StatCard({ number, label, supporting }: { number: string; label: string; supporting: string }) {
  return (
    <Card className="border-border bg-card p-5">
      <p className="text-3xl font-bold text-foreground mb-1">{number}</p>
      <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">{supporting}</p>
    </Card>
  );
}

function SignalCell({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function StepCard({
  number,
  heading,
  time,
  description,
  href,
  external,
}: {
  number: string;
  heading: string;
  time: string;
  description: string;
  href: string;
  external?: boolean;
}) {
  const inner = (
    <div className="flex gap-4 items-start">
      <span
        className="text-2xl font-bold shrink-0 w-8 text-right"
        style={{ color: 'var(--accent-brand)' }}
      >
        {number}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-foreground">{heading}</p>
          <span className="text-xs text-muted-foreground">({time})</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
    </div>
  );

  const cls =
    'block rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted/30';

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

function WhyCard({ badge, headline, detail }: { badge: string; headline: string; detail: string }) {
  return (
    <Card className="border-border bg-card p-5">
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-2"
        style={{ color: 'var(--accent-brand)' }}
      >
        {badge}
      </p>
      <p className="text-sm font-semibold text-foreground mb-2">{headline}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ForRecruitersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* ── Section 1: Header + CTAs ─────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            For Recruiters &amp; Hiring Managers
          </p>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Everything you need to evaluate Prasad
          </h1>
          <p className="text-muted-foreground mb-6">
            VP / Head / Senior Director AI Platform candidate — in 60 seconds.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="/api/resume-download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: 'var(--accent-brand)' }}
            >
              <Download className="w-4 h-4" />
              Download Resume
            </a>
            <a
              href="https://linkedin.com/in/pkavuri"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              LinkedIn
            </a>
            <a
              href="https://calendly.com/vbkpkavuri"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Book 30-min Call
            </a>
          </div>
        </div>

        {/* ── Section 2: 60-second summary ─────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Executive Summary
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              number={EXECUTIVE_METRICS.yearsExperience}
              label="Years Experience"
              supporting="Building and scaling AI platforms"
            />
            <StatCard
              number={EXECUTIVE_METRICS.engineersLed}
              label="Engineers Led"
              supporting="Global teams across India, US, Europe"
            />
            <StatCard
              number={EXECUTIVE_METRICS.b2bCustomersEnabled}
              label="B2B Customers Enabled"
              supporting="Enterprise API platform at Ola Maps"
            />
            <StatCard
              number={EXECUTIVE_METRICS.costReductionDisplay}
              label="Cost Reduction Delivered"
              supporting="Up to 70% — AI inference at scale"
            />
            <StatCard
              number={EXECUTIVE_METRICS.revenueLaunched}
              label="Revenue Launched"
              supporting="Krutrim AI platform, 0 → production"
            />
          </div>
        </div>

        {/* ── Section 3: Leadership signal ─────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Leadership Signal
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <SignalCell
              title="Production AI Platform Leadership"
              detail="Scaled from 0 to $10M+ ARR"
            />
            <SignalCell
              title="India's First Sovereign LLM"
              detail="Led Krutrim AI — Kruti.ai built from scratch"
            />
            <SignalCell
              title="Cost &amp; Scale Discipline"
              detail="70% inference cost reduction"
            />
            <SignalCell
              title="Global Org Leadership"
              detail="200+ engineers across 3 continents"
            />
            <SignalCell
              title="Enterprise AI Team Building"
              detail="Built HERE Technologies AI team from scratch"
            />
          </div>
        </div>

        {/* ── Section 4: Guided path ────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Recommended Path (2-3 minutes)
          </p>
          <div className="flex flex-col gap-3">
            <StepCard
              number="1"
              heading="Start with capability map"
              time="30 sec"
              description="See platform capabilities mapped to concrete portfolio evidence in one executive view"
              href="/capabilities"
            />
            <StepCard
              number="2"
              heading="See the flagship demo"
              time="60 sec"
              description="Watch the AI quality and governance pipeline in action — eval gating, drift detection, HITL checkpoint"
              href="/demos/evaluation-showcase"
            />
            <StepCard
              number="3"
              heading="Review governance controls"
              time="45 sec"
              description="Validate trust controls, traceability, and operational rigor before reviewing credentials"
              href="/governance"
            />
            <StepCard
              number="4"
              heading="Book a conversation"
              time="30 sec"
              description="30 minutes — I'll walk you through any part of the platform you want to explore"
              href="https://calendly.com/vbkpkavuri"
              external
            />
          </div>
        </div>

        {/* ── Section 5: Why VP / Head ──────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            The Role I&apos;m Built For
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <WhyCard
              badge="I've done it"
              headline="Led 200+ engineers, shipped production AI at scale"
              detail="Built sovereign LLM infrastructure from zero. Scaled AI orgs from 40 to 200 engineers. Delivered measurable outcomes at Krutrim, Ola, and HERE Technologies."
            />
            <WhyCard
              badge="I build for business outcomes"
              headline="Every architecture decision has a number attached"
              detail="70% cost reduction. 50% latency improvement. $10M+ revenue. I connect engineering depth to the metrics boards care about."
            />
            <WhyCard
              badge="I govern, not just build"
              headline="Evaluation pipelines, HITL, drift monitoring"
              detail="I've implemented the controls that let AI run safely at enterprise scale — the layer most teams skip until something breaks in production."
            />
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="border-t border-border pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to full portfolio
          </Link>
        </div>

      </div>
    </div>
  );
}
