'use client';

import { FadeUp } from '@/components/ui/motion';

interface CaseStudy {
  badge: string;
  role: string;
  period: string;
  title: string;
  challenge: string;
  whatILed: string[];
  keyDecisions: string[];
  impact: string[];
}

/**
 * Every line below is grounded in src/data/profile.json (the verified resume record).
 * Do not add ROI figures, trade-off rationale, or outcomes that are not in profile.json —
 * new claims go through the case-study questionnaire first (SPEC-0022).
 */
const caseStudies: CaseStudy[] = [
  {
    badge: "Krutrim",
    role: "Head of AI Engineering",
    period: "March 2025 – June 2026",
    title: "Building India's First Agentic AI Platform",
    challenge:
      "Deliver a production agentic AI platform (Kruti.ai) across mobility, commerce, and payments while integrating diverse AI models and vendors into one reliable, 24/7 production ecosystem.",
    whatILed: [
      "End-to-end architecture and delivery of Kruti.ai: multi-model LLM orchestration, RAG pipelines, vector search, and real-time personalization",
      "A 200+ global engineering organization delivering enterprise-grade 24/7 PaaS capabilities",
      "$10M–$20M annual engineering budget across AI infrastructure, platform operations, and global delivery",
      "Domain-specific AI agents for cab booking, food ordering, bill payments, and image generation",
    ],
    keyDecisions: [
      "Multi-model orchestration with intelligent model routing rather than a single model",
      "One unified production ecosystem across diverse AI models and vendors",
      "SDK/API integration strategy to grow the agent ecosystem across external partners",
    ],
    impact: [
      "50% latency reduction",
      "40% cost savings",
      "New B2B and B2C revenue streams at national scale",
      "Accelerated enterprise client adoption through the SDK/API strategy",
    ],
  },
  {
    badge: "Ola",
    role: "Senior Director of Engineering",
    period: "Sept 2023 – Feb 2025",
    title: "Scaling AI-Powered Mapping to 13,000+ Enterprise Customers",
    challenge:
      "Turn Ola Maps into a core cloud-native mobility layer for enterprise customers while materially reducing infrastructure spend and keeping reliability high.",
    whatILed: [
      "Platform transformation across cloud-native infrastructure, LLM-powered routing, and B2B APIs",
      "$8M–$15M annual engineering budget",
      "Cross-functional engineering teams across the US and India",
      "AI-powered real-time route optimization for fleet management",
    ],
    keyDecisions: [
      "Cloud-native architectural overhaul to take out infrastructure cost",
      "B2B APIs as the core mobility layer for enterprise customers",
      "AI-powered route optimization for fleet management",
    ],
    impact: [
      "70% infrastructure cost reduction",
      "13,000+ B2B enterprise customers",
      "Reliability maintained across millions of daily API calls",
      "Improved ETA accuracy and customer satisfaction",
    ],
  },
  {
    badge: "HERE Technologies",
    role: "Director of Engineering — Highly Automated Driving",
    period: "July 2021 – June 2023 · 18+ years at HERE (Sr Engineer → Director)",
    title: "Delivering AI/ML Infrastructure for Autonomous Driving at Global Scale",
    challenge:
      "Deliver AI-enhanced HD mapping and lane-level automation for major OEM autonomous driving platforms, in a safety-critical, regulated environment.",
    whatILed: [
      "AI-enhanced HD mapping and lane-level automation systems",
      "Global engineering teams across North America, Europe, and APAC",
      "$10M–$20M annual engineering budget for HD mapping and autonomous driving AI infrastructure",
      "Core infrastructure for ML/AI products as Head of Infrastructure and Services",
    ],
    keyDecisions: [
      "AI/ML advancements to improve map precision",
      "Engineering practices built for safety-critical, regulated programs",
      "Global delivery model across North America, Europe, and APAC",
    ],
    impact: [
      "HD mapping supporting major OEM autonomous driving platforms",
      "Improved map precision through AI/ML",
      "18+ year progression from Sr Engineer to Director",
    ],
  },
];

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-2 text-sm text-foreground leading-relaxed">
          <span className="text-indigo-500 flex-shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CaseStudies() {
  return (
    <section id="case-studies" className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-16">
          <p className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-3">
            Selected Leadership Impact
          </p>
          <h2 className="text-3xl font-semibold mb-4">
            Where Strategy Met Execution
          </h2>
          <p className="text-muted-foreground">
            Three transformations — the challenge, the decisions, and the outcome. Together they trace a 20-year arc: from infrastructure behind autonomous driving at global OEM scale, to cloud-native platforms at Ola, to India&apos;s first agentic AI platform at Krutrim.
          </p>
        </div>

        {/* Case Studies */}
        <div>
          {caseStudies.map((study, idx) => (
            <FadeUp key={idx} delay={idx * 0.15}>
              <div>
                <div className="border border-border rounded-2xl p-8 hover:border-indigo-500/40 transition-colors">
                  {/* Header Row */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <span className="inline-block bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold">
                        {study.badge}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">{study.role}</p>
                      <p className="text-xs text-muted-foreground">{study.period}</p>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-semibold mb-8" style={{ color: 'var(--accent-brand)' }}>
                    {study.title}
                  </h3>

                  {/* Four Columns */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Challenge */}
                    <div>
                      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                        Challenge
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {study.challenge}
                      </p>
                    </div>

                    {/* What I Led */}
                    <div>
                      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                        What I Led
                      </p>
                      <BulletList items={study.whatILed} />
                    </div>

                    {/* Key Decisions */}
                    <div>
                      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                        Key Decisions
                      </p>
                      <BulletList items={study.keyDecisions} />
                    </div>

                    {/* Impact */}
                    <div>
                      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                        Impact
                      </p>
                      <ul className="space-y-2">
                        {study.impact.map((item, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-foreground leading-relaxed font-semibold">
                            <span className="text-indigo-500 flex-shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                {idx < caseStudies.length - 1 && (
                  <div className="h-px bg-border my-8" />
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
