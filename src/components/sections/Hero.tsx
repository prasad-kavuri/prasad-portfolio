'use client';

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/counter";
import { GovernancePillars } from "@/components/ui/governance-pillars";
import profile from "@/data/profile.json";
import { trackEvent } from "@/lib/analytics";
import { CopyForAI } from "@/components/CopyForAI";
import { PORTFOLIO_FACTS } from "@/data/site-config";
import { EXECUTIVE_METRICS_DISPLAY } from "@/lib/executive-metrics";

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
              alt="Profile"
            />
            <div>
              <h1 id="profile-name" className="text-3xl font-semibold">
                {profile.personal.name}
              </h1>
              <p className="mt-1 max-w-3xl text-lg text-muted-foreground">
                {profile.personal.subtitle}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Enterprise AI, Built for Day&nbsp;2
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

          <p id="profile-summary" className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {profile.personal.summary}
          </p>

          <p className="mt-4 max-w-3xl rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm font-medium text-foreground">
            Most AI programs fail in production because cost discipline, governance, and operational ownership are bolted on too late.
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

          <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-3">
            <Link
              href="/for-recruiters"
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: 'var(--accent-brand)' }}
            >
              Recruiter Fast-Track
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="/demos/evaluation-showcase"
              style={brandStyle}
              onClick={() => trackEvent('signature_system_clicked')}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            >
              Explore Signature System
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <Link href="/demos" className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium">
              Browse All {PORTFOLIO_FACTS.productionDemoCount} Demos
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-2.5 sm:gap-3">
            <a
              href={profile.personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('linkedin_clicked')}
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
                View LinkedIn
              </a>
            <a
              href="/api/resume-download"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('resume_downloaded')}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Download Resume
            </a>
            <CopyForAI />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {EXECUTIVE_METRICS_DISPLAY.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-muted/60 px-4 py-3.5">
                <AnimatedCounter value={s.value} className="text-2xl font-semibold tracking-tight" />
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                {s.context && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground/70">{s.context}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-border pt-7">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Currently Exploring
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                On-device Small Language Models
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                Agent-to-Agent (A2A) Protocol
              </span>
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
                Currently exploring{' '}
                <span className="font-medium text-foreground">
                  VP / Head of AI Engineering
                </span>
                {' '}and{' '}
                <span className="font-medium text-foreground">
                  AI Platform Leadership
                </span>
                {' '}roles — Chicago area &amp; remote.{' '}
                <a
                  href="https://calendly.com/vbkpkavuri"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:no-underline"
                  style={{ color: 'var(--accent-brand)' }}
                >
                  Let&apos;s talk →
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
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                View LinkedIn
              </a>
              <a
                href="mailto:vbkpkavuri@gmail.com"
                style={brandStyle}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              >
                Start a Conversation
              </a>
              <a
                href="https://calendly.com/vbkpkavuri"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('calendly_clicked')}
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
          </div>
        </div>
      </div>
    </>
  );
}
