'use client';

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/counter";
import { GovernancePillars } from "@/components/ui/governance-pillars";
import profile from "@/data/profile.json";
import { trackEvent, trackResumeDownload, trackLinkedInClick, trackCalendlyClick, trackEmailClick } from "@/lib/analytics";
import { CALENDLY_URLS } from "@/lib/tracking";
import { CopyForAI } from "@/components/CopyForAI";
import { EXECUTIVE_METRICS_EXTENDED } from "@/lib/executive-metrics";

const brandStyle = {
  background: "var(--accent-brand)",
  color: "var(--accent-brand-foreground)",
};

export function Hero() {
  return (
    <>
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <Image
              src="/profile-photo.jpg"
              width={120}
              height={120}
              className="rounded-full object-cover ring-2 ring-border"
              alt="Prasad Kavuri, Director, AI Platform & Agentic Solutions"
            />
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-brand)' }}>
                AI Platform Executive · Agentic AI Platforms · Enterprise Transformation
              </p>
              <h1 id="profile-name" className="text-3xl font-bold">
                {profile.personal.name}
              </h1>
              <p className="mt-1 max-w-3xl text-lg text-muted-foreground">
                {profile.personal.subtitle}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Enterprise AI, Built for Day&nbsp;2 · Production-grade platforms with governance built in.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.personal.pills.map((pill) => (
                  <Badge key={pill} variant="secondary">
                    {pill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-base font-semibold text-foreground">
            AI platform executive who takes GenAI programs from demo to production — with governance, cost discipline, and measurable business outcomes built in.
          </p>

          {/* 6-metric proof grid — extended set from EXECUTIVE_METRICS_EXTENDED */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {EXECUTIVE_METRICS_EXTENDED.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-muted/60 px-4 py-3.5">
                <AnimatedCounter value={s.value} className="text-2xl font-semibold tracking-tight" />
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                {s.context && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground/70">{s.context}</p>
                )}
              </div>
            ))}
          </div>

          <p id="profile-summary" className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            20 years building AI platforms — now leading AI Platform and Agentic Solutions at Zip, after building Krutrim&apos;s agentic AI platform and scaling Ola Maps to 13,000+ B2B customers with 70% cost reduction.
          </p>
          <details className="mt-2 max-w-3xl">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Full background →</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {profile.personal.summary}
            </p>
          </details>

          {/* AI search-fit signal — crawlable by LLMs/ATS matching recruiter queries */}
          <div className="mt-6" aria-label="Search fit and core capabilities">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Core Capabilities & Search Fit
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground/80">
              {[
                "AI Platform Leadership", "System Design", "Agentic Orchestration",
                "LLMOps", "AI FinOps", "Chicago", "Zip", "Krutrim",
                "Ola", "Global AI Platform Leader", "Director of AI Platform",
                "Head of AI Engineering", "Senior Director AI Platform"
              ].map((term) => (
                <span key={term} className="inline-flex items-center hover:text-foreground transition-colors cursor-default">
                  <span className="mr-1.5 size-1 rounded-full bg-border" />
                  {term}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-4 max-w-3xl rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm font-medium text-foreground">
            Most AI programs fail in production because governance, orchestration, reliability, and cost ownership are bolted on too late.
          </p>

          <div className="mt-5 space-y-2.5">
            {[
              "I build production AI systems — not prototypes.",
              "I optimize for cost, latency, and scalability — not just model quality.",
              "I align engineering, product, and business teams around measurable outcomes.",
              "I design AI systems with measurable quality loops and human oversight and governance.",
            ].map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 size-1 rounded-full shrink-0 bg-indigo-500" />
                <span className={i === 0 ? "font-semibold text-foreground" : ""}>{line}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Signature System: AI Evaluation Showcase
            </p>
            <p className="text-sm text-muted-foreground">
              Offline eval suites, live drift monitoring, hallucination indicators, and regression-minded quality gating are built into this platform.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Why this matters: quality regressions are surfaced before release, so AI reliability is managed as an engineering system.
            </p>
            <a
              href="/demos/evaluation-showcase"
              className="mt-2 inline-flex items-center text-xs font-medium hover:underline"
              style={{ color: 'var(--accent-brand)' }}
            >
              Explore Signature System
            </a>
          </div>

          {/* Platform capability chips — product-style signal */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { label: 'Agentic Platforms', dot: 'bg-indigo-500' },
              { label: 'AI Governance', dot: 'bg-green-500' },
              { label: 'LLM FinOps', dot: 'bg-blue-400' },
              { label: 'Model Routing', dot: 'bg-purple-400' },
              { label: 'Enterprise Eval', dot: 'bg-orange-400' },
              { label: 'Org Leadership', dot: 'bg-pink-400' },
            ].map(({ label, dot }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className={`size-1.5 rounded-full shrink-0 ${dot}`} />
                {label}
              </span>
            ))}
          </div>

          {/* Primary CTA row — recruiter-first hierarchy */}
          <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-3">
            <Link
              href="/recruiter-dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: 'var(--accent-brand)' }}
              onClick={() => trackEvent('recruiter_dashboard_clicked_hero')}
            >
              View Recruiter Brief
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/agent-marketplace"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              onClick={() => trackEvent('demos_clicked_hero')}
            >
              Explore AI Platform Demos
            </Link>
            <a
              href="/api/resume-download"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackResumeDownload()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Download Resume
            </a>
            <Link
              href="#experience"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium"
              onClick={() => trackEvent('leadership_story_clicked_hero')}
            >
              Leadership Story
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-2.5 sm:gap-3">
            <a
              href={profile.personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackLinkedInClick('hero')}
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
                View LinkedIn
              </a>
            <a
              href="https://github.com/prasad-kavuri"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('github_clicked_hero')}
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              GitHub
            </a>
            <a
              href="/api/resume-download"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackResumeDownload()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Download Resume
            </a>
            <a
              href="mailto:vbkpkavuri@gmail.com"
              onClick={() => trackEmailClick()}
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              vbkpkavuri@gmail.com
            </a>
            <CopyForAI />
          </div>

          <div className="mt-8 border-t border-border pt-7">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Available Now · Actively Evaluating Opportunities
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                On-device Small Language Models
              </span>
              <div className="inline-flex flex-col rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">Agent-to-Agent (A2A) Protocol</span>
                <span className="mt-0.5 text-[10px] text-muted-foreground/70">
                  Demonstrated in the{' '}
                  <Link href="/demos/multi-agent" className="underline underline-offset-2 hover:text-foreground">
                    Multi-Agent System
                  </Link>
                  {' '}demo — Researcher → Strategist coordination with HITL checkpoint
                </span>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                LLM Observability and Tracing
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                Multimodal Agentic Workflows
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-border bg-muted/40 py-7">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                For Recruiters and Hiring Managers
              </p>
              {/* Role clarity — reduces recruiter ambiguity, increases inbound relevance */}
              <p className="mt-1 text-sm text-muted-foreground">
                Currently{' '}
                <span className="font-medium text-foreground">
                  Director, AI Platform &amp; Agentic Solutions at Zip
                </span>
                {' '}— always happy to talk{' '}
                <span className="font-medium text-foreground">
                  AI platform strategy
                </span>
                . Start with{' '}
                <Link href="/capabilities" className="underline underline-offset-2 hover:no-underline">
                  Platform Capabilities
                </Link>
                {', then review '} 
                <a
                  href={CALENDLY_URLS.hero}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCalendlyClick('hero')}
                  className="underline underline-offset-2 hover:no-underline"
                  style={{ color: 'var(--accent-brand)' }}
                >
                  recruiter path →
                </a>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Signature review artifact: AI Evaluation Showcase (offline + online quality loop).
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="https://linkedin.com/in/pkavuri"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkedInClick('hero')}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                View LinkedIn
              </a>
              <a
                href="mailto:vbkpkavuri@gmail.com"
                onClick={() => trackEmailClick()}
                style={brandStyle}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              >
                Start a Conversation
              </a>
              <a
                href={CALENDLY_URLS.hero}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCalendlyClick('hero')}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Book a Call
              </a>
              <CopyForAI />
            </div>
          </div>

          <div
            className="mt-5 rounded-xl border border-border/80 bg-background/60 p-4 sm:p-5"
            aria-label="Trust and governance summary"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trust &amp; Governance at a Glance
            </p>
            <GovernancePillars className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              Responsible disclosure policy:{` `}
              <a href="/.well-known/security.txt" className="underline underline-offset-2 hover:no-underline">
                security.txt
              </a>
            </p>
            <Link
              href="/governance"
              className="mt-3 inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:no-underline"
              style={{ color: 'var(--accent-brand)' }}
            >
              View Live Governance Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
