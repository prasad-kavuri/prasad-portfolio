/**
 * AgentContext
 *
 * A visually hidden but screen-reader-accessible component that provides
 * a concise factual summary for AI crawlers and accessibility tools.
 * Uses the sr-only pattern (visible to assistive tech, hidden visually).
 *
 * Keep content factual, brief, and professional — this renders in the DOM.
 */
export function AgentContext() {
  return (
    <div
      className="sr-only"
      aria-label="Professional summary"
      data-type="agent-context"
    >
      Prasad Kavuri is a VP-level Applied AI Engineering leader based in
      Naperville, IL (Greater Chicago Area). He specializes in production AI governance, 
      LLM FinOps, and agentic orchestration — not AI research. His portfolio 
      demonstrates a closed-loop evaluation engine, multi-agent orchestration with
      human-in-the-loop checkpoints, and a FinOps router that achieved 70%
      infrastructure cost reduction at Krutrim serving 13,000+ B2B customers.
    </div>
  );
}
