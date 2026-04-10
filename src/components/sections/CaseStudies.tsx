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

const caseStudies: CaseStudy[] = [
  {
    badge: "Krutrim",
    role: "Head of AI Engineering",
    period: "March 2025 – Present",
    title: "Building India's First Agentic AI Platform",
    challenge:
      "Fragmented AI capabilities with no unified platform for real-time, production-grade agentic workflows at scale.",
    whatILed: [
      "Multi-model LLM orchestration platform",
      "Domain-specific AI agents (cab, food, payments)",
      "Real-time personalization engine",
      "Enterprise PaaS with SDK/API layer",
      "Team of 200+ engineers globally",
    ],
    keyDecisions: [
      "Vendor-agnostic architecture to avoid lock-in",
      "Latency vs cost tradeoff framework per use case",
      "Built for production workflows, not demos",
      "Unified platform over point solutions",
    ],
    impact: [
      "50% latency reduction",
      "40% cost savings",
      "Production-scale agent deployments",
      "India's first agentic AI ecosystem",
    ],
  },
  {
    badge: "Ola",
    role: "Senior Director of Engineering",
    period: "Sept 2023 – Feb 2025",
    title: "Scaling AI-Powered Mapping to 13,000+ Enterprise Customers",
    challenge:
      "Scaling a nascent maps platform into a production-grade B2B product while reducing infrastructure costs by 70% and competing with established global providers.",
    whatILed: [
      "Cloud-native infrastructure redesign",
      "AI-powered real-time route optimization",
      "B2B platform and enterprise API layer",
      "150+ engineers across US and India",
      "Strategic vendor partnerships",
    ],
    keyDecisions: [
      "Cloud-native over lift-and-shift migration",
      "B2B API-first go-to-market",
      "AI routing over rule-based optimization",
      "Electric mobility infrastructure investment",
    ],
    impact: [
      "13,000+ B2B enterprise customers",
      "70% infrastructure cost reduction",
      "Millions of daily API calls",
      "Improved ETA accuracy across fleet",
    ],
  },
  {
    badge: "HERE Technologies",
    role: "Director of Engineering — Highly Automated Driving",
    period: "2005 – 2023 (18 years)",
    title: "Delivering AI/ML Infrastructure for Autonomous Driving at Global Scale",
    challenge:
      "Building production-grade AI/ML infrastructure for safety-critical autonomous driving systems, supporting major OEM partners across North America, Europe, and APAC.",
    whatILed: [
      "HD mapping and lane-level automation systems",
      "Global team of 85+ engineers (NA, Europe, APAC)",
      "AI/ML infrastructure for ADAS platforms",
      "Progression: Sr Engineer → Director over 18 years",
    ],
    keyDecisions: [
      "Safety-first architecture for regulated environments",
      "Global team distribution strategy",
      "AI-enhanced precision over manual map processes",
      "Long-term OEM partnership model",
    ],
    impact: [
      "HD maps powering major OEM autonomous platforms",
      "18-year tenure with consistent scope expansion",
      "Sr Engineer → Director progression",
      "Global engineering organization built from ground up",
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
            Three flagship transformations — the challenge, the decisions, and the outcome.
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
