import Link from 'next/link';

export const metadata = {
  title: 'Why Most Enterprise AI Initiatives Stall — Prasad Kavuri',
  description: 'The pilots work. The demos impress. Then nothing ships to production. The problem is platform thinking, not technology.',
  alternates: { canonical: 'https://www.prasadkavuri.com/perspectives/why-enterprise-ai-stalls' },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 mb-8 inline-block">← Back to portfolio</Link>
      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Enterprise AI</p>
      <h1 className="text-3xl font-semibold text-slate-100 mb-3 leading-tight">
        Why Most Enterprise AI Initiatives Stall Before They Matter
      </h1>
      <p className="text-slate-500 text-sm mb-10">3 min read · Prasad Kavuri</p>
      <div className="space-y-5 text-slate-300 leading-relaxed text-base">
        <p>The pilots work. The demos impress. Then nothing ships to production. The problem isn&apos;t the technology — it&apos;s that most organizations treat AI as a series of projects rather than a platform decision.</p>
        <p>When AI is project-driven, every initiative has its own model selection, its own data pipeline, its own evaluation approach, and its own governance assumptions. There&apos;s no shared infrastructure, no reusable evaluation framework, and no cost baseline to optimize against. The result is a portfolio of one-offs, each requiring its own maintenance burden and its own business case justification every budget cycle.</p>
        <p>The organizations that succeed treat AI as a platform from day one. That means a shared orchestration layer, a centralized guardrail and evaluation system, and a FinOps discipline applied to inference costs the same way it&apos;s applied to cloud spend. The platform decisions made in months one through three determine whether year two is expansion or firefighting.</p>
        <p>The gap between experimentation and operation is an engineering and organizational problem — not a model problem. The models are good enough. The question is whether the system around them is designed to run reliably at scale, with human oversight where it matters, and cost controls that make the math work for the business.</p>
        <p>This is the pattern I&apos;ve applied at Krutrim and Ola: build the evaluation and governance layer early, treat cost as a first-class engineering constraint, and design for the operational team that will run this in 18 months — not just for the demo that wins the project.</p>
      </div>
      <div className="mt-12 pt-8 border-t border-slate-800">
        <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">← Back to portfolio</Link>
      </div>
    </main>
  );
}
