'use client'
import { useState } from 'react';
import { FadeUp } from '@/components/ui/motion';

const ARTICLES = [
  {
    id: "enterprise-ai-fails",
    eyebrow: "Enterprise AI",
    title: "Why Most Enterprise AI Initiatives Stall Before They Matter",
    preview: "The pilots work. The demos impress. Then nothing ships to production. The problem isn't the technology — it's that most organizations treat AI as a series of projects rather than a platform decision.",
    readTime: "3 min read",
    content: `I've been part of enough AI transformations to see the pattern clearly. The pilots work. The demos impress. Then nothing ships to production.

The problem isn't the technology. It's that most organizations treat AI as a series of projects rather than a platform decision. Each initiative builds from scratch — its own data pipeline, its own integration layer, its own evaluation criteria. When the pilot ends, there's nothing left to build on.

The second failure point is disconnection from real workflows. Teams optimize AI outputs in isolation while the business keeps operating the same way. A model that produces great answers nobody acts on isn't delivering value — it's delivering comfort.

The third is the one nobody wants to talk about: misalignment between what engineering measures and what the business needs. Engineering tracks model performance. The business tracks cost, speed, and outcomes. When those two aren't mapped to each other, you get impressive benchmarks and no business impact.

What I've seen work: build the infrastructure layer first so every new AI use case doesn't start from zero. Embed AI into actual decision flows, not alongside them. And define business outcomes before you write a single prompt.

The organizations that move beyond pilots are the ones that stop asking "can we build this with AI?" and start asking "how does this change how we operate?" That's a different question — and it requires a different kind of leadership to answer it.`
  },
  {
    id: "agentic-operating-model",
    eyebrow: "Agentic AI",
    title: "Agentic AI Changes More Than Your Tech Stack — It Changes How Work Gets Done",
    preview: "Most of the conversation around agentic AI is still focused on the model layer. That's the wrong level of abstraction. The more important shift is operational.",
    readTime: "4 min read",
    content: `Most of the conversation around agentic AI is still focused on the model layer. Which agent framework. Which LLM. How to write better prompts. That's the wrong level of abstraction.

The more important shift is operational. When you move from software that executes fixed workflows to systems that interpret goals and decide their own action sequences, you're not just changing your architecture — you're changing how work actually happens.

I saw this clearly building Kruti.ai. We weren't just building agents that could answer questions. We were redesigning workflows: cab booking, food ordering, payments — processes that previously required explicit user steps now handled through goal-directed AI execution. The technical challenge was real, but the organizational challenge was harder. People had to stop thinking in terms of "what does the user click" and start thinking in terms of "what outcome does the user want."

The architectural implications follow from that shift. Agents need memory across interactions, not just within them. They need real tool integrations, not mock APIs. They need guardrails and human approval points built into the workflow, not bolted on afterward. And they need latency and cost budgets that reflect real production constraints.

Most companies building with agents are still one layer too shallow — they're building chat interfaces that call tools, not systems that plan, execute, and adapt. The difference matters. One is a feature. The other is an operating model.`
  },
  {
    id: "production-ai-tradeoffs",
    eyebrow: "Production AI",
    title: "The Real Work in Production AI Is Managing Tradeoffs, Not Selecting Models",
    preview: "When you're running AI at scale, model selection is maybe 20% of the problem. The other 80% is system design — and most of that is tradeoff management.",
    readTime: "4 min read",
    content: `When you're running AI at scale, model selection is maybe 20% of the problem. The other 80% is system design — and most of that is tradeoff management.

Every production AI system operates inside three constraints: cost, latency, and quality. You can usually optimize two of them. Getting all three requires architecture, not just better models.

At Ola Maps, we were running millions of API calls daily. Using a single high-quality model for every request would have been straightforward to build and impossible to sustain economically. So we built routing logic: simple queries go to faster, cheaper models; complex spatial reasoning gets routed to higher-capability inference. The business outcome was the same. The cost profile was completely different.

This is why I think of LLM routing as core infrastructure, not an optimization. If you're building AI systems that need to operate at enterprise scale, you need to design for model diversity from the start — not as an afterthought when your inference bill arrives.

The same logic applies to retrieval. RAG isn't just a technique for improving accuracy. It's a cost control mechanism. Retrieving relevant context and routing it to a smaller model often outperforms sending everything to a large one — at a fraction of the cost and latency.

The engineers who build the best production AI systems aren't the ones who pick the best model. They're the ones who design the best routing, retrieval, caching, and fallback strategies around whatever models are available. That's the actual craft — and it's what separates demos from systems that survive contact with production.`
  }
];

export function Perspectives() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section id="perspectives" className="py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-16">
          <span
            className="text-xs font-semibold tracking-widest uppercase mb-3 block"
            style={{ color: 'var(--accent-brand)' }}
          >
            PERSPECTIVES
          </span>
          <h2 className="text-3xl font-semibold mb-4">How I Think About AI</h2>
          <p className="text-muted-foreground">
            Lessons from building and scaling AI systems in production.
          </p>
        </div>

        {/* Articles */}
        <div>
          {ARTICLES.map((article, index) => (
            <FadeUp key={article.id} delay={index * 0.1}>
              <article
                className="border border-border rounded-xl p-6 mb-4 bg-background hover:border-indigo-500/30 transition-colors"
              >
                {/* Title and Read Time */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                      {article.eyebrow}
                    </span>
                    <h3 className="text-lg font-semibold mt-1 leading-snug">
                      {article.title}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap mt-1 flex-shrink-0">
                    {article.readTime}
                  </span>
                </div>

                {/* Preview */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {article.preview}
                </p>

                {/* Expandable Content */}
                {expandedId === article.id && (
                  <div className="border-t border-border pt-4 mt-2">
                    {article.content.split('\n\n').map((para, i) => (
                      <p
                        key={i}
                        className="text-sm text-foreground leading-relaxed mb-4 last:mb-0"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {/* Toggle Button */}
                <button
                  onClick={() =>
                    setExpandedId(
                      expandedId === article.id ? null : article.id
                    )
                  }
                  className="text-sm font-medium flex items-center gap-1 transition-colors hover:opacity-70"
                  style={{ color: 'var(--accent-brand)' }}
                >
                  {expandedId === article.id ? (
                    <>
                      <span>Collapse</span>
                      <span>↑</span>
                    </>
                  ) : (
                    <>
                      <span>Read more</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
