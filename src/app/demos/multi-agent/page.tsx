"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  Loader2,
  PlayCircle,
  Search,
  Shield,
  SquareTerminal,
  TriangleAlert,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { GovernancePillars } from "@/components/ui/governance-pillars";
import { createTracedFetch, generateClientTraceId, logAPIEvent } from "@/lib/observability";
import { validateHandoff, validateHandoffContext } from "@/lib/guardrails";
import {
  AGENT_DEFINITIONS,
  INITIAL_ORCHESTRATION_STATE,
  type AgentId,
  type HandoffEvent,
} from "@/lib/agents/handoff-model";
import { orchestrationReducer } from "@/lib/agents/orchestration";
import { AgentGraph } from "./AgentGraph";
import { AuditTrail } from "./AuditTrail";

interface AgentResult {
  name: string;
  role: string;
  findings: string[];
  recommendation: string;
  confidence: number;
  duration_ms: number;
  tokens: number;
}

interface AnalysisResult {
  website: string;
  agents: AgentResult[];
  total_duration_ms: number;
  total_tokens: number;
}

type StageState = "idle" | "running" | "completed" | "paused" | "failed";

type WorkflowStageId =
  | "request-intake"
  | "analyzer"
  | "researcher"
  | "strategist"
  | "human-approval"
  | "final-output";

const AGENTS = [
  { id: "analyzer", name: "Analyzer", role: "Technical site analysis" },
  { id: "researcher", name: "Researcher", role: "Best-practice and benchmark review" },
  { id: "strategist", name: "Strategist", role: "Action plan proposal" },
] as const;

const WORKFLOW_STAGES: {
  id: WorkflowStageId;
  label: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    id: "request-intake",
    label: "Request Intake",
    detail: "Validate target and initialize execution context.",
    icon: SquareTerminal,
  },
  {
    id: "analyzer",
    label: "Analyzer",
    detail: "Surface architecture, reliability, and UX signals.",
    icon: Search,
  },
  {
    id: "researcher",
    label: "Researcher",
    detail: "Compare against known patterns and best practices.",
    icon: Bot,
  },
  {
    id: "strategist",
    label: "Strategist",
    detail: "Draft decision-ready recommendation and rollout path.",
    icon: ClipboardList,
  },
  {
    id: "human-approval",
    label: "Human Approval",
    detail: "Checkpoint before high-impact recommendation release.",
    icon: UserCheck,
  },
  {
    id: "final-output",
    label: "Final Output",
    detail: "Publish executive-readable recommendation and rationale.",
    icon: BadgeCheck,
  },
];

const EXAMPLE_URLS = [
  "https://www.prasadkavuri.com",
  "https://github.com/prasad-kavuri",
  "https://openai.com",
  "https://anthropic.com",
];

const STATUS_STYLES: Record<StageState, string> = {
  idle: "border-border bg-muted/40 text-muted-foreground",
  running: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-300",
  completed: "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-300",
  paused: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  failed: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStateIcon(state: StageState) {
  if (state === "running") return <Loader2 className="size-4 animate-spin" aria-hidden="true" />;
  if (state === "completed") return <CheckCircle2 className="size-4" aria-hidden="true" />;
  if (state === "paused") return <Clock3 className="size-4" aria-hidden="true" />;
  if (state === "failed") return <TriangleAlert className="size-4" aria-hidden="true" />;
  return <Circle className="size-4" aria-hidden="true" />;
}

function getStateText(state: StageState) {
  if (state === "running") return "Running";
  if (state === "completed") return "Completed";
  if (state === "paused") return "Paused";
  if (state === "failed") return "Failed";
  return "Idle";
}

function getDomain(inputUrl: string): string {
  try {
    return new URL(inputUrl).hostname.replace(/^www\./, "");
  } catch {
    return "target site";
  }
}

function buildDeterministicFallback(website: string): AnalysisResult {
  const domain = getDomain(website);
  return {
    website,
    total_duration_ms: 2280,
    total_tokens: 1370,
    agents: [
      {
        name: "Analyzer",
        role: "Technical site analysis",
        findings: [
          `${domain} shows strong executive positioning and clear AI platform signal hierarchy.`,
          "Navigation prioritizes recruiter paths and capability evidence.",
        ],
        recommendation: "Retain current information architecture and tighten demo-to-business linkage copy.",
        confidence: 84,
        duration_ms: 560,
        tokens: 380,
      },
      {
        name: "Researcher",
        role: "Best-practice and benchmark review",
        findings: [
          "Comparable executive AI portfolios emphasize explicit governance and handoff control patterns.",
          "Structured evidence maps improve recruiter comprehension in under 60 seconds.",
        ],
        recommendation: "Highlight governance checkpoints and explicit handoff policies in workflow storytelling.",
        confidence: 81,
        duration_ms: 690,
        tokens: 430,
      },
      {
        name: "Strategist",
        role: "Action plan proposal",
        findings: [
          "Promote a handoff-first operating model with visible policy checks and traceability.",
        ],
        recommendation:
          "Adopt governed handoff orchestration: enforce destination policy, require approval at high-impact steps, and publish audit events for every transfer.",
        confidence: 86,
        duration_ms: 1030,
        tokens: 560,
      },
    ],
  };
}

function getLatestHandoff(handoffs: HandoffEvent[], fromAgent: AgentId, toAgent: AgentId) {
  for (let i = handoffs.length - 1; i >= 0; i -= 1) {
    const item = handoffs[i];
    if (item.fromAgent === fromAgent && item.toAgent === toAgent) {
      return item;
    }
  }
  return null;
}

export default function MultiAgentPage() {
  const [traceId, setTraceId] = useState<string>("");
  const tracedFetch = useRef(createTracedFetch(""));
  const [url, setUrl] = useState<string>("https://www.prasadkavuri.com");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pendingResult, setPendingResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [reviewMode, setReviewMode] = useState(true);
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [runtimeSeconds, setRuntimeSeconds] = useState(0);
  const [usedFallback, setUsedFallback] = useState(false);
  const [workflowStartAt, setWorkflowStartAt] = useState<number | null>(null);

  const [orchState, dispatch] = useReducer(orchestrationReducer, INITIAL_ORCHESTRATION_STATE);
  const orchStateRef = useRef(orchState);
  const activeRunRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    orchStateRef.current = orchState;
  }, [orchState]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (orchState.status !== "running") return;
    setRuntimeSeconds(0);
    const timer = setInterval(() => {
      setRuntimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [orchState.status, workflowStartAt]);

  const runStatus = useMemo(() => {
    if (error || orchState.status === "failed") return "error";
    if (pendingResult) return "pending_review";
    if (orchState.status === "completed" && result) return "done";
    if (orchState.status === "running") return "running";
    return "idle";
  }, [error, orchState.status, pendingResult, result]);

  const activeData = pendingResult ?? result;

  const traceCards = useMemo(() => {
    const source = activeData?.agents ?? [];
    const domain = getDomain(url);

    const fallbackRecommendation = (agentName: string, stage: StageState) => {
      if (stage === "running") {
        if (agentName === "Analyzer") return `Scanning ${domain} for reliability, navigation, and architecture constraints.`;
        if (agentName === "Researcher") return `Comparing ${domain} against enterprise benchmark patterns and trade-offs.`;
        return `Synthesizing a decision-ready rollout recommendation for ${domain}.`;
      }
      if (stage === "paused") {
        return "Strategist recommendation is prepared and waiting for explicit human approval.";
      }
      if (stage === "completed") {
        if (agentName === "Analyzer") return "Baseline architecture constraints captured for strategic handoff.";
        if (agentName === "Researcher") return "Best-practice options and risks summarized for strategist synthesis.";
        return "Recommendation drafted with constraints, options, and business impact.";
      }
      if (stage === "failed") return "Execution halted due to a blocked transition.";
      return "Waiting for workflow execution.";
    };

    const analyzerHandoff = getLatestHandoff(orchState.handoffs, "analyzer", "researcher");
    const researcherHandoff = getLatestHandoff(orchState.handoffs, "researcher", "strategist");

    return AGENTS.map((agent, index) => {
      const found = source.find((a) => a.name === agent.name);
      let state: StageState = "idle";
      const id = agent.id as AgentId;

      if (orchState.activeAgent === id && runStatus === "running") {
        state = "running";
      } else if (id === "analyzer" && analyzerHandoff && analyzerHandoff.status !== "blocked") {
        state = "completed";
      } else if (id === "researcher" && researcherHandoff && researcherHandoff.status !== "blocked") {
        state = "completed";
      } else if (id === "strategist" && pendingResult) {
        state = "paused";
      } else if (runStatus === "done") {
        state = "completed";
      }

      if (
        orchState.handoffs.some(
          (handoff) =>
            (handoff.fromAgent === id || handoff.toAgent === id) &&
            (handoff.status === "blocked" || handoff.status === "denied")
        ) ||
        runStatus === "error"
      ) {
        state = "failed";
      }

      return {
        ...agent,
        state,
        sequence: index + 1,
        findings: found?.findings ?? [],
        recommendation: found?.recommendation ?? fallbackRecommendation(agent.name, state),
        confidence: found?.confidence,
        duration_ms: found?.duration_ms,
        tokens: found?.tokens,
      };
    });
  }, [activeData, orchState.activeAgent, orchState.handoffs, pendingResult, runStatus, url]);

  const workflowStates = useMemo(() => {
    const hasAnalyzerHandoff = Boolean(getLatestHandoff(orchState.handoffs, "analyzer", "researcher"));
    const hasResearcherHandoff = Boolean(getLatestHandoff(orchState.handoffs, "researcher", "strategist"));
    const strategistToHitl = getLatestHandoff(orchState.handoffs, "strategist", "hitl");
    const hitlToSynth = getLatestHandoff(orchState.handoffs, "hitl", "synthesizer");

    const getStageState = (stageId: WorkflowStageId): StageState => {
      if (runStatus === "error") {
        if (["request-intake", "analyzer", "researcher", "strategist", "human-approval"].includes(stageId)) {
          return "failed";
        }
        return "idle";
      }

      if (runStatus === "idle") return "idle";

      if (stageId === "request-intake") return "completed";
      if (stageId === "analyzer") {
        if (orchState.activeAgent === "analyzer") return "running";
        return hasAnalyzerHandoff ? "completed" : "idle";
      }
      if (stageId === "researcher") {
        if (orchState.activeAgent === "researcher") return "running";
        return hasResearcherHandoff ? "completed" : "idle";
      }
      if (stageId === "strategist") {
        if (orchState.activeAgent === "strategist") return "running";
        if (strategistToHitl) {
          if (strategistToHitl.status === "blocked" || strategistToHitl.status === "denied") return "failed";
          return "completed";
        }
        return "idle";
      }
      if (stageId === "human-approval") {
        if (!reviewMode) return runStatus === "done" ? "completed" : "idle";
        if (pendingResult) return "paused";
        if (strategistToHitl && ["approved", "completed", "accepted"].includes(strategistToHitl.status)) {
          return "completed";
        }
        return "idle";
      }
      if (stageId === "final-output") {
        if (runStatus === "done") return "completed";
        if (orchState.activeAgent === "synthesizer") return "running";
        if (hitlToSynth && hitlToSynth.status === "blocked") return "failed";
        return "idle";
      }

      return "idle";
    };

    return WORKFLOW_STAGES.map((stage) => ({ ...stage, state: getStageState(stage.id) }));
  }, [orchState.activeAgent, orchState.handoffs, pendingResult, reviewMode, runStatus]);

  const progress = useMemo(() => {
    if (runStatus === "idle") return 0;
    const completed = workflowStates.filter((stage) => stage.state === "completed").length;
    const running = workflowStates.some((stage) => stage.state === "running") ? 1 : 0;
    const paused = workflowStates.some((stage) => stage.state === "paused") ? 1 : 0;
    const baseline = Math.round((completed / workflowStates.length) * 100);
    const inFlight = running ? 8 : paused ? 4 : 0;
    return Math.min(100, baseline + inFlight);
  }, [runStatus, workflowStates]);

  const executeHandoff = async (
    runId: number,
    from: AgentId,
    to: AgentId,
    reason: string,
    contextSummary: string
  ) => {
    const destinationCheck = validateHandoff(from, to, AGENT_DEFINITIONS);
    if (!destinationCheck.valid) {
      dispatch({ type: "REQUEST_HANDOFF", from, to, reason, contextSummary });
      await sleep(20);
      const blocked = getLatestHandoff(orchStateRef.current.handoffs, from, to);
      if (blocked) {
        dispatch({ type: "BLOCK_HANDOFF", handoffId: blocked.id, reason: destinationCheck.reason ?? "Policy blocked handoff" });
      }
      dispatch({ type: "FAIL_WORKFLOW", reason: destinationCheck.reason ?? "Handoff validation failed" });
      return null;
    }

    const contextCheck = validateHandoffContext(contextSummary);
    if (!contextCheck.safe) {
      dispatch({ type: "REQUEST_HANDOFF", from, to, reason, contextSummary });
      await sleep(20);
      const blocked = getLatestHandoff(orchStateRef.current.handoffs, from, to);
      if (blocked) {
        dispatch({ type: "BLOCK_HANDOFF", handoffId: blocked.id, reason: contextCheck.reason ?? "Context blocked" });
      }
      dispatch({ type: "FAIL_WORKFLOW", reason: contextCheck.reason ?? "Handoff context blocked" });
      return null;
    }

    dispatch({ type: "REQUEST_HANDOFF", from, to, reason, contextSummary });
    await sleep(40);
    if (!mountedRef.current || activeRunRef.current !== runId) return null;

    const handoff = getLatestHandoff(orchStateRef.current.handoffs, from, to);
    if (!handoff || handoff.status === "blocked") {
      dispatch({ type: "FAIL_WORKFLOW", reason: "Handoff request failed" });
      return null;
    }

    dispatch({ type: "ACCEPT_HANDOFF", handoffId: handoff.id });
    await sleep(30);
    return handoff.id;
  };

  const continueToCompletion = async (runId: number, data: AnalysisResult) => {
    const strategistAgent = data.agents.find((agent) => agent.name === "Strategist");
    const hitlToSynthId = await executeHandoff(
      runId,
      "hitl",
      "synthesizer",
      "Approved recommendation can move to final synthesis.",
      strategistAgent?.recommendation ?? "Approved strategy ready for publication"
    );
    if (!hitlToSynthId || !mountedRef.current || activeRunRef.current !== runId) return;

    dispatch({ type: "ACTIVATE_AGENT", agentId: "synthesizer" });
    await sleep(80);
    if (!mountedRef.current || activeRunRef.current !== runId) return;

    dispatch({ type: "COMPLETE_AGENT", agentId: "synthesizer" });
    dispatch({ type: "COMPLETE_WORKFLOW" });
    setResult(data);
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    const runId = activeRunRef.current + 1;
    activeRunRef.current = runId;

    const newTraceId = generateClientTraceId();
    setTraceId(newTraceId);
    tracedFetch.current = createTracedFetch(newTraceId);
    setError("");
    setResult(null);
    setPendingResult(null);
    setReviewDraft("");
    setReviewNote("");
    setUsedFallback(false);
    setWorkflowStartAt(Date.now());

    dispatch({ type: "START_WORKFLOW", traceId: newTraceId });

    let data: AnalysisResult;
    try {
      const response = await tracedFetch.current("/api/multi-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website_url: url,
          approvalState: reviewMode ? "pending" : "approved",
        }),
      });

      if (!response.ok) {
        throw new Error("API workflow request failed");
      }

      data = (await response.json()) as AnalysisResult;
    } catch {
      setUsedFallback(true);
      logAPIEvent({
        event: "multi_agent.fallback_activated",
        route: "/demos/multi-agent",
        severity: "warn",
        traceId: newTraceId,
        reason: "api_unavailable_or_failed",
      });
      data = buildDeterministicFallback(url);
    }

    if (!mountedRef.current || activeRunRef.current !== runId) return;

    const analyzer = data.agents.find((agent) => agent.name === "Analyzer");
    const researcher = data.agents.find((agent) => agent.name === "Researcher");
    const strategist = data.agents.find((agent) => agent.name === "Strategist");

    dispatch({ type: "ACTIVATE_AGENT", agentId: "analyzer" });
    await sleep(30);
    if (!mountedRef.current || activeRunRef.current !== runId) return;

    dispatch({ type: "COMPLETE_AGENT", agentId: "analyzer" });
    const analyzerHandoffId = await executeHandoff(
      runId,
      "analyzer",
      "researcher",
      "Analyzer findings passed for benchmark comparison.",
      analyzer?.findings.join(" ") ?? "Analyzer constraints summary"
    );
    if (!analyzerHandoffId || !mountedRef.current || activeRunRef.current !== runId) return;

    dispatch({ type: "ACTIVATE_AGENT", agentId: "researcher" });
    await sleep(30);
    if (!mountedRef.current || activeRunRef.current !== runId) return;

    dispatch({ type: "COMPLETE_AGENT", agentId: "researcher" });
    const researcherHandoffId = await executeHandoff(
      runId,
      "researcher",
      "strategist",
      "Research synthesis passed for recommendation drafting.",
      researcher?.findings.join(" ") ?? "Research benchmark summary"
    );
    if (!researcherHandoffId || !mountedRef.current || activeRunRef.current !== runId) return;

    dispatch({ type: "ACTIVATE_AGENT", agentId: "strategist" });
    await sleep(30);
    if (!mountedRef.current || activeRunRef.current !== runId) return;

    dispatch({ type: "COMPLETE_AGENT", agentId: "strategist" });
    const strategistHandoffId = await executeHandoff(
      runId,
      "strategist",
      "hitl",
      "Strategist recommendation requires release governance review.",
      strategist?.recommendation ?? "Strategist recommendation summary"
    );
    if (!strategistHandoffId || !mountedRef.current || activeRunRef.current !== runId) return;

    dispatch({ type: "ACTIVATE_AGENT", agentId: "hitl" });

    if (reviewMode) {
      dispatch({ type: "REQUEST_APPROVAL", handoffId: strategistHandoffId });
      setPendingResult(data);
      setReviewDraft(strategist?.recommendation ?? "");
      return;
    }

    dispatch({ type: "REQUEST_APPROVAL", handoffId: strategistHandoffId });
    dispatch({ type: "GRANT_APPROVAL", handoffId: strategistHandoffId });
    await continueToCompletion(runId, data);
  };

  const handleApprovePending = async () => {
    if (!pendingResult) return;

    const strategistToHitl = getLatestHandoff(orchState.handoffs, "strategist", "hitl");
    if (!strategistToHitl) {
      setError("Approval handoff reference is missing. Please rerun the workflow.");
      return;
    }

    const revised = reviewDraft.trim();
    const nextResult = revised
      ? {
          ...pendingResult,
          agents: pendingResult.agents.map((agent) =>
            agent.name === "Strategist" ? { ...agent, recommendation: revised } : agent
          ),
        }
      : pendingResult;

    const runId = activeRunRef.current;
    dispatch({ type: "GRANT_APPROVAL", handoffId: strategistToHitl.id });
    setPendingResult(null);
    setReviewNote("");

    await continueToCompletion(runId, nextResult);
  };

  const handleRegeneratePending = () => {
    if (!pendingResult) return;
    const revised = reviewDraft.trim();
    if (!revised) {
      setReviewNote("Add revision guidance before applying a strategist edit.");
      return;
    }

    setPendingResult({
      ...pendingResult,
      agents: pendingResult.agents.map((agent) =>
        agent.name === "Strategist" ? { ...agent, recommendation: revised } : agent
      ),
    });
    setReviewNote("Revision applied. Approve to release strategist output.");
  };

  const handleCancelPending = () => {
    const strategistToHitl = getLatestHandoff(orchState.handoffs, "strategist", "hitl");
    if (strategistToHitl) {
      dispatch({ type: "DENY_APPROVAL", handoffId: strategistToHitl.id });
    }
    setReviewNote("Approval denied. You can revise or restart the workflow.");
  };

  const strategist = activeData?.agents.find((a) => a.name === "Strategist");
  const analyzer = activeData?.agents.find((a) => a.name === "Analyzer");
  const researcher = activeData?.agents.find((a) => a.name === "Researcher");

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'Multi-Agent System',
    description: 'CrewAI-powered agents with real LLM calls via Groq — Analyzer, Researcher, and Strategist collaborating in real time.',
    keywords: 'CrewAI, Groq, Llama 3.3, Handoff Architecture, Audit Trail, Agent Orchestration',
    url: 'https://www.prasadkavuri.com/demos/multi-agent',
    author: { '@type': 'Person', '@id': 'https://www.prasadkavuri.com/#person', name: 'Prasad Kavuri', url: 'https://www.prasadkavuri.com', sameAs: ['https://www.linkedin.com/in/pkavuri/', 'https://github.com/prasad-kavuri'] },
    about: { '@type': 'Thing', name: 'AI Engineering' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight">Multi-Agent System</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Governed Multi-Agent Orchestration — Handoff Architecture · Audit Trail · HITL
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["CrewAI", "Groq", "Handoff Architecture", "Audit Trail", "Human Approval", "Traceable Decisions"].map((item) => (
                <Badge key={item} variant="outline" className="bg-muted/40">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mb-6 border-border bg-card/80 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label htmlFor="workflow-url" className="block text-sm font-semibold text-foreground">
                Request Intake
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a site to analyze. The workflow runs Analyzer → Researcher → Strategist, then pauses for human approval.
              </p>
              <input
                id="workflow-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={runStatus === "running"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && runStatus !== "running") {
                    void handleAnalyze();
                  }
                }}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLE_URLS.slice(0, 2).map((example) => (
                  <button
                    key={example}
                    onClick={() => setUrl(example)}
                    className="rounded-md border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                    disabled={runStatus === "running"}
                  >
                    Example: {example.replace("https://", "")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={reviewMode}
                  onChange={(e) => setReviewMode(e.target.checked)}
                  className="size-4"
                />
                Enable Human Review Mode
              </label>
              <Button
                onClick={() => void handleAnalyze()}
                disabled={runStatus === "running" || !url.trim()}
                aria-label="Start multi-agent analysis workflow"
                className="min-h-[44px] bg-blue-600 hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background"
              >
                {runStatus === "running" ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Running workflow...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 size-4" />
                    Run workflow
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">Trace ID: <span className={traceId ? "font-mono text-blue-400" : "text-slate-500"}>{traceId || "— run workflow to generate —"}</span></p>
              {usedFallback ? (
                <p className="text-xs text-amber-500">Fallback mode active: running deterministic local orchestration because backend execution was unavailable.</p>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="mb-6">
          <AgentGraph state={orchState} definitions={AGENT_DEFINITIONS} />
        </div>

        <Card className="mb-6 border-blue-500/30 bg-blue-500/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-blue-500" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-foreground">Thinking Preservation</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Qwen3.6-27B natively retains chain-of-thought reasoning across historical messages — reducing context drift in long-running agentic workflows. This demo&apos;s orchestration pattern is designed to leverage this capability for more stable multi-turn decision chains.
              </p>
            </div>
            <Badge variant="outline" className="w-fit bg-background/70">
              Qwen3.6-27B compatible
            </Badge>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <Card className="border-border bg-card/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Workflow Stages</CardTitle>
                <p className="text-xs text-muted-foreground">Persistent execution rail with explicit state visibility.</p>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2" aria-label="Workflow stages">
                  {workflowStates.map((stage, idx) => {
                    const Icon = stage.icon;
                    return (
                      <li
                        key={stage.id}
                        className={`rounded-lg border-l-4 p-3 transition-all ${STATUS_STYLES[stage.state]} ${stage.state === "running" ? "shadow-sm ring-1 ring-blue-500/30" : ""} ${
                          stage.state === "completed" ? "border-l-green-500" : stage.state === "running" ? "border-l-blue-500" : stage.state === "paused" ? "border-l-amber-500" : stage.state === "failed" ? "border-l-red-500" : "border-l-border"
                        }`}
                        aria-live="polite"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-md border border-current/30 p-1.5">
                            <Icon className="size-4" aria-hidden="true" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold">{idx + 1}. {stage.label}</p>
                              <span className="inline-flex items-center gap-1 text-xs font-medium">
                                {getStateIcon(stage.state)}
                                {getStateText(stage.state)}
                                {stage.state === "running" && <span className="inline-block size-1.5 rounded-full bg-blue-500 animate-pulse" />}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs leading-relaxed opacity-90">{stage.detail}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>

            {orchState.version > 0 ? <AuditTrail events={orchState.auditLog} /> : null}

            <Card className="border-border bg-card/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Execution Trace</CardTitle>
                <p className="text-xs text-muted-foreground">Structured agent trace with sequence, summary, and status.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {traceCards.map((agent) => (
                  <div
                    key={agent.id}
                    className={`rounded-lg border p-4 transition-all ${STATUS_STYLES[agent.state]} ${agent.state === "running" ? "ring-1 ring-blue-500/30" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">#{agent.sequence} {agent.name}</p>
                        <p className="text-xs opacity-90">{agent.role}</p>
                      </div>
                      <span className="text-xs font-medium">{getStateText(agent.state)}</span>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed">
                      {agent.findings[0] ?? agent.recommendation}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] opacity-80">
                      {agent.confidence !== undefined && <span>Confidence: {agent.confidence}%</span>}
                      {agent.duration_ms !== undefined && <span>{agent.duration_ms}ms</span>}
                      {agent.tokens !== undefined && <span>{agent.tokens} tokens</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {runStatus === "running" && (
              <Card className="border-border bg-card/70">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">Workflow progress</span>
                    <span className="text-muted-foreground">{Math.floor(progress)}% · {runtimeSeconds}s elapsed</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {pendingResult ? (
              <Card className="border-amber-500/40 bg-amber-500/5 shadow-sm ring-1 ring-amber-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-amber-600 dark:text-amber-300">Human Approval Required</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Strategist requires approval to proceed. This checkpoint enforces controlled autonomy for high-impact recommendations.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border bg-background/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proposed Strategist Action</p>
                    <textarea
                      aria-label="Strategist revision guidance"
                      value={reviewDraft}
                      onChange={(e) => {
                        setReviewDraft(e.target.value);
                        setReviewNote("");
                      }}
                      rows={5}
                      className="mt-2 w-full rounded border border-border bg-background p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Review or revise the recommendation before release."
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Why this gate exists: protects strategic decisions with explicit human oversight and accountable release control.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What the Strategist is about to do</p>
                    <p className="mt-1 text-sm text-foreground">{reviewDraft || strategist?.recommendation}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void handleApprovePending()}
                      aria-label="Approve strategist recommendation and finalize workflow"
                      className="min-h-[44px] min-w-[44px] px-6 py-3 bg-green-600 hover:bg-green-700 focus-visible:ring-4 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={handleRegeneratePending}
                      variant="outline"
                      aria-label="Apply revision guidance to strategist recommendation"
                      className="min-h-[44px] min-w-[44px] px-6 py-3 focus-visible:ring-4 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background"
                    >
                      Revise
                    </Button>
                    <Button
                      onClick={handleCancelPending}
                      variant="outline"
                      aria-label="Cancel pending review and return to start"
                      className="min-h-[44px] min-w-[44px] px-6 py-3 focus-visible:ring-4 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background"
                    >
                      Deny
                    </Button>
                  </div>

                  {reviewNote && <p className="text-xs text-muted-foreground">{reviewNote}</p>}
                </CardContent>
              </Card>
            ) : runStatus === "done" && result ? (
              <Card className="border-border bg-card/70">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Final Recommendation</CardTitle>
                  <p className="text-xs text-muted-foreground">Executive-ready output with rationale and trade-off context.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommendation</p>
                    <p className="mt-1 text-sm text-foreground">{strategist?.recommendation}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-background/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rationale</p>
                      <p className="mt-1 text-sm text-foreground">{researcher?.findings[0] ?? "Synthesized from analyzer and researcher outputs."}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Constraints Considered</p>
                      <p className="mt-1 text-sm text-foreground">{analyzer?.findings[0] ?? "Latency, reliability, and implementation complexity."}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alternatives / Trade-offs</p>
                      <p className="mt-1 text-sm text-foreground">{researcher?.findings[1] ?? "Compared implementation speed vs long-term operability."}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Business Outcome</p>
                      <p className="mt-1 text-sm text-foreground">Faster decision cycles with explicit governance and audit-ready traceability.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-background/70 p-3 text-xs text-muted-foreground">
                    <span>Total duration: {(result.total_duration_ms / 1000).toFixed(1)}s</span>
                    <span>Total tokens: {result.total_tokens.toLocaleString()}</span>
                    <span>Trace ID: <span className="font-mono text-blue-400">{traceId}</span></span>
                  </div>
                </CardContent>
              </Card>
            ) : runStatus === "error" ? (
              <Card className="border-red-500/40 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-red-600 dark:text-red-300">Workflow Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 dark:text-red-300">{error || "Workflow blocked due to failed handoff validation."}</p>
                  <Button
                    onClick={() => {
                      setError("");
                      setPendingResult(null);
                      setResult(null);
                    }}
                    variant="outline"
                    className="mt-3"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-card/70">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Final Output Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Run the workflow to generate a structured recommendation with rationale, constraints, and trade-off framing.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-card/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Business Value of This Pattern</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <p><span className="font-medium text-foreground">Faster decisions:</span> parallel specialist analysis shortens cycle time.</p>
                <p><span className="font-medium text-foreground">Safer execution:</span> approval checkpoints prevent unreviewed strategic actions.</p>
                <p><span className="font-medium text-foreground">Clear auditability:</span> trace IDs and stage history support review.</p>
                <p><span className="font-medium text-foreground">Better coordination:</span> scoped agent roles reduce ambiguity in recommendations.</p>
                <p><span className="font-medium text-foreground">Explicit handoff policies:</span> typed transfers with blocked-state handling.</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70" aria-label="Trust controls">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="size-4" />
                  Governance Controls in This Demo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">Handoff validation — destination and context checked before transfer executes.</p>
                <GovernancePillars compact />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
