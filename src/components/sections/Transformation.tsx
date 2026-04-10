'use client';

import { FadeUp } from '@/components/ui/motion';

export function Transformation() {
  const columns = [
    {
      number: "01",
      title: "Platform",
      description:
        "Designing scalable AI infrastructure — multi-model orchestration, RAG pipelines, vector search, and real-time personalization systems that run at enterprise scale.",
      tags: ["LLM Orchestration", "RAG Pipelines", "Vector Search", "PaaS Architecture"],
      icon: (
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="3" />
          <rect x="4" y="9" width="16" height="3" />
          <rect x="4" y="14" width="16" height="3" />
          <rect x="4" y="19" width="16" height="1" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Workflow",
      description:
        "Embedding AI into real business processes and decision flows — not as isolated pilots, but as operating capability that changes how work actually gets done.",
      tags: ["Agent Automation", "Decision Systems", "Real-time AI", "Process Integration"],
      icon: (
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3 12h6m6 0h6M9 6l-3 3 3 3M15 6l3 3-3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Organization",
      description:
        "Aligning engineering, product, and business teams around AI execution — building the operating model, team structure, and governance that makes AI transformation stick.",
      tags: ["Team Scaling", "AI Governance", "Exec Alignment", "Operating Model"],
      icon: (
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="8" cy="7" r="2" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="12" cy="14" r="2" />
          <path d="M8 9v2c0 1 1 2 2 2h4c1 0 2-1 2-2V9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <section id="transformation" className="bg-slate-900 py-20">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <FadeUp>
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-3">
              How I Drive AI Transformation
            </p>
            <h2 className="text-3xl font-semibold text-white mb-4 max-w-2xl">
              Delivering AI impact requires more than models
            </h2>
            <p className="text-lg text-slate-400 max-w-xl">
              It requires aligning systems, workflows, and organizations to operate with AI — not just experiment with it.
            </p>
          </div>
        </FadeUp>

        {/* Three Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {columns.map((col, idx) => (
            <FadeUp key={idx} delay={idx * 0.1}>
              <div
                className="border border-slate-700 rounded-xl p-8 hover:border-indigo-500/50 transition-colors"
              >
                {/* Number */}
                <div className="text-5xl font-bold text-indigo-500/20 mb-4">
                  {col.number}
                </div>

                {/* Icon */}
                <div className="mb-4">
                  {col.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {col.title}
                </h3>

                {/* Description */}
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  {col.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {col.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Quote */}
        <div className="border-l-4 border-indigo-500 pl-6 max-w-2xl mx-auto">
          <p className="text-lg text-slate-300 italic">
            "The gap between AI experimentation and AI operation is an engineering and organizational problem — not a model problem."
          </p>
        </div>
      </div>
    </section>
  );
}
