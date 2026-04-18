"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

const AI_PROFILE_MARKDOWN = `# Prasad Kavuri — VP / Head of AI Engineering

**Location**: Naperville, IL (Greater Chicago Area)
**Website**: https://www.prasadkavuri.com
**LinkedIn**: https://linkedin.com/in/pkavuri
**GitHub**: https://github.com/prasad-kavuri

## Summary

Applied AI engineering executive with 20+ years building production-grade AI platforms
at enterprise scale. Specializes in agentic orchestration, LLM FinOps, and production AI governance.

**Key metrics**: 70% infrastructure cost reduction | 50% latency reduction |
13,000+ B2B customers | 200+ engineers led | 13 production AI systems

## Core Capabilities

- Agentic Orchestration (MCP protocol, Langgraph, CrewAI, HITL checkpoints)
- LLM FinOps (routing, token optimization, cost guardrails)
- Production AI Governance (HITL, drift monitoring, audit trails)
- LLMOps (observability, trace propagation, eval frameworks)
- Global Engineering Leadership (200+ engineers, APAC/EMEA/Americas)

## Career Highlights

**Krutrim / Ola** — Head of AI Engineering
- India's first Agentic AI platform for 13,000+ B2B customers
- 70% infra cost reduction via LLM routing
- Closed-loop evaluation engine, HITL checkpoints

**HERE Technologies** — Director of Engineering
- 50% latency reduction across global AI platform
- Scaled engineering org to 200+ across global regions
- Built multi-agent orchestration for real-time HD mapping

## Open To

VP AI, Head of AI Engineering, CTO - AI Transformation, Chief AI Officer

## Live Portfolio Demos

https://www.prasadkavuri.com/demos
`;

export function CopyForAI() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROFILE_MARKDOWN);
      setCopied(true);
      trackEvent('copy_for_ai_clicked');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = AI_PROFILE_MARKDOWN;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      trackEvent('copy_for_ai_clicked');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy profile summary formatted for AI assistants"
      className={`
        inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
        border rounded-lg transition-all duration-200
        ${copied
          ? "border-green-500/50 text-green-500 bg-green-500/10"
          : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-muted/50"
        }
      `}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy Profile for AI
        </>
      )}
    </button>
  );
}
