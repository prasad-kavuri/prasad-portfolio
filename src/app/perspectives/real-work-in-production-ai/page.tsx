export const metadata = {
  title: 'The Real Work in Production AI Is Managing Tradeoffs — Prasad Kavuri',
  description: 'When running AI at scale, model selection is maybe 20% of the problem. The other 80% is system design.',
  alternates: { canonical: 'https://www.prasadkavuri.com/perspectives/real-work-in-production-ai' },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <a href="/" className="text-sm text-slate-400 hover:text-slate-200 mb-8 inline-block">← Back to portfolio</a>
      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Production AI</p>
      <h1 className="text-3xl font-semibold text-slate-100 mb-3 leading-tight">
        The Real Work in Production AI Is Managing Tradeoffs, Not Selecting Models
      </h1>
      <p className="text-slate-500 text-sm mb-10">4 min read · Prasad Kavuri</p>
      <div className="space-y-5 text-slate-300 leading-relaxed text-base">
        <p>When you&apos;re running AI at scale, model selection is maybe 20% of the problem. The other 80% is system design — and most of that is tradeoff management.</p>
        <p>Every production AI system is a bundle of tradeoffs: latency versus cost, accuracy versus speed, model capability versus inference budget, privacy versus personalization. None of these have universal right answers. They have right answers for a specific business context, a specific user expectation, and a specific cost structure — and those answers change as the system scales.</p>
        <p>The practical implication is that the most valuable thing an AI engineering team can build early is a routing and evaluation layer — not the most powerful model integration, but the infrastructure that lets you measure these tradeoffs and adjust them over time. Hardcoding model choices is like hardcoding database queries: it works until the moment it doesn&apos;t, and then the cost to change is enormous.</p>
        <p>At Krutrim, we built a multi-model routing layer that selected inference targets based on request complexity, cost tolerance, and latency SLAs. The result was a 40–50% reduction in inference costs while maintaining response quality — not through a better model, but through smarter routing and a continuous eval loop that caught regressions before they reached users.</p>
        <p>The teams I see struggling with production AI are usually optimizing the wrong variable: model benchmarks. The teams succeeding are optimizing for system-level outcomes: cost per useful interaction, time to detect quality regression, infrastructure cost as a percentage of value delivered. Those are the metrics that separate AI experiments from AI platforms.</p>
      </div>
      <div className="mt-12 pt-8 border-t border-slate-800">
        <a href="/" className="text-sm text-blue-400 hover:text-blue-300">← Back to portfolio</a>
      </div>
    </main>
  );
}
