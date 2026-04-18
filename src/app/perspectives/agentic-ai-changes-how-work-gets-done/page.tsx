import Link from 'next/link';

export const metadata = {
  title: 'Agentic AI Changes More Than Your Tech Stack — Prasad Kavuri',
  description: 'Most of the conversation around agentic AI is still focused on the model layer. The more important shift is operational.',
  alternates: { canonical: 'https://www.prasadkavuri.com/perspectives/agentic-ai-changes-how-work-gets-done' },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 mb-8 inline-block">← Back to portfolio</Link>
      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Agentic AI</p>
      <h1 className="text-3xl font-semibold text-slate-100 mb-3 leading-tight">
        Agentic AI Changes More Than Your Tech Stack — It Changes How Work Gets Done
      </h1>
      <p className="text-slate-500 text-sm mb-10">4 min read · Prasad Kavuri</p>
      <div className="space-y-5 text-slate-300 leading-relaxed text-base">
        <p>Most of the conversation around agentic AI is still focused on the model layer. Which foundation model, which orchestration framework, which vector database. That&apos;s the wrong level of abstraction. The more important shift is operational.</p>
        <p>When AI moves from answering questions to executing tasks, the failure modes change completely. A wrong answer in a chatbot is annoying. A wrong action in an agent workflow can modify data, trigger downstream systems, or make irreversible decisions. The engineering discipline required is closer to distributed systems reliability than to prompt engineering.</p>
        <p>This means human-in-the-loop checkpoints aren&apos;t a nice-to-have — they&apos;re an architectural requirement for any agentic system operating in a business context. It means evaluation frameworks need to cover not just response quality but action correctness. And it means trace IDs and audit logs need to be first-class citizens, not afterthoughts.</p>
        <p>The organizations getting this right are treating agentic AI the way they treat any other production system: with runbooks, rollback procedures, cost budgets, and on-call escalation paths. The ones struggling are treating it like a chatbot that can also do things — and discovering, usually painfully, that the gap between those two mental models is enormous.</p>
        <p>Building agentic systems that actually ship to production requires rethinking not just the tech stack but the operating model around it. That&apos;s the work I find most interesting — and the problem that most AI deployments are still underestimating.</p>
      </div>
      <div className="mt-12 pt-8 border-t border-slate-800">
        <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">← Back to portfolio</Link>
      </div>
    </main>
  );
}
