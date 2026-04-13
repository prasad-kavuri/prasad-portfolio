'use client';

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/counter";
import profile from "@/data/profile.json";
import { trackEvent } from "@/lib/analytics";

const brandStyle = {
  background: "var(--accent-brand)",
  color: "var(--accent-brand-foreground)",
};

export function Hero() {
  return (
    <>
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
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
              <p className="text-lg text-muted-foreground">
                {profile.personal.title} · {profile.personal.subtitle}
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

          <p id="profile-summary" className="mt-8 max-w-2xl leading-relaxed text-muted-foreground">
            {profile.personal.summary}
          </p>

          <div className="mt-6 mb-2 space-y-2">
            {[
              "I build production AI systems — not prototypes.",
              "I optimize for cost, latency, and scalability — not just model quality.",
              "I align engineering, product, and business teams around measurable outcomes.",
              "I design AI systems that combine capability with human oversight and governance.",
            ].map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 size-1 rounded-full shrink-0 bg-indigo-500" />
                <span>{line}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/demos/multi-agent"
              style={brandStyle}
              onClick={() => trackEvent('signature_demo_clicked')}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            >
              View Signature Demo
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a
              href="#tools"
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Explore All Demos
            </a>
            <a
              href={profile.personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('linkedin_clicked')}
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              View LinkedIn
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {profile.stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-muted p-4">
                <AnimatedCounter value={s.value} className="text-2xl font-semibold" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 border-t border-border pt-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Currently Exploring
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                ⚡ On-device Small Language Models
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                🔗 Agent-to-Agent (A2A) Protocol
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                🔍 LLM Observability and Tracing
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                🎯 Multimodal Agentic Workflows
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-border bg-muted/40 py-6">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                For Recruiters and Hiring Managers
              </p>
              <p className="text-sm text-muted-foreground">
                Available for VP / Head of AI Engineering roles
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/api/resume-download"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('resume_downloaded')}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Download Resume
              </a>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
