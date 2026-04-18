"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { resolveReviewCheckpoint } from "@/lib/hitl";
import { createTracedFetch } from "@/lib/observability";

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

type RunStatus = "idle" | "running" | "pending_review" | "done" | "error";
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

export default function MultiAgentPage() {
  const [traceId, setTraceId] = useState<string>('');
  const tracedFetch = useRef(createTracedFetch(''));
  const [url, setUrl] = useState<string>("https://www.prasadkavuri.com");
  const [status, setStatus] = useState<RunStatus>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pendingResult, setPendingResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [currentAgent, setCurrentAgent] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [reviewMode, setReviewMode] = useState(true);
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [runtimeSeconds, setRuntimeSeconds] = useState(0);

  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== "running") return;
    setRuntimeSeconds(0);
    const timer = setInterval(() => {
      setRuntimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (progress >= 33 && progress < 66 && currentAgent !== "Researcher") {
      setCurrentAgent("Researcher");
    } else if (progress >= 66 && currentAgent !== "Strategist") {
      setCurrentAgent("Strategist");
    } else if (progress < 33 && currentAgent !== "Analyzer") {
      setCurrentAgent("Analyzer");
    }
  }, [progress, currentAgent]);

  const activeData = pendingResult ?? result;

  const workflowStates = useMemo(() => {
    const getStageState = (stageId: WorkflowStageId): StageState => {
      if (status === "error") {
        if (stageId === "request-intake" || stageId === "analyzer" || stageId === "researcher") {
          return "failed";
        }
        return "idle";
      }

      if (status === "idle") return "idle";

      if (status === "running") {
        if (stageId === "request-intake") return "completed";
        if (stageId === "analyzer") {
          if (currentAgent === "Analyzer") return "running";
          return progress >= 33 ? "completed" : "idle";
        }
        if (stageId === "researcher") {
          if (currentAgent === "Researcher") return "running";
          return progress >= 66 ? "completed" : "idle";
        }
        if (stageId === "strategist") {
          return currentAgent === "Strategist" ? "running" : "idle";
        }
        return "idle";
      }

      if (status === "pending_review") {
        if (["request-intake", "analyzer", "researcher"].includes(stageId)) return "completed";
        if (stageId === "strategist" || stageId === "human-approval") return "paused";
        return "idle";
      }

      if (status === "done") {
        if (stageId === "human-approval" && !reviewMode) return "idle";
        return "completed";
      }

      return "idle";
    };

    return WORKFLOW_STAGES.map((stage) => ({
      ...stage,
      state: getStageState(stage.id),
    }));
  }, [status, currentAgent, progress, reviewMode]);

  const traceCards = useMemo(() => {
    const source = activeData?.agents ?? [];
    const domain = (() => {
      try {
        return new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return "target site";
      }
    })();

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
      return "Waiting for workflow execution.";
    };

    return AGENTS.map((agent, index) => {
      const found = source.find((a) => a.name === agent.name);
      let state: StageState = "idle";
      if (status === "running") {
        if (currentAgent === agent.name) state = "running";
        else if ((agent.name === "Analyzer" && progress >= 33) || (agent.name === "Researcher" && progress >= 66)) {
          state = "completed";
        }
      }
      if (status === "pending_review") {
        if (agent.name === "Strategist") state = "paused";
        else state = "completed";
      }
      if (status === "done") state = "completed";
      if (status === "error") state = "failed";

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
  }, [activeData, currentAgent, progress, status, url]);

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    // Regenerate trace ID on each workflow run — real trace IDs are unique per invocation
    const newTraceId = crypto.randomUUID();
    setTraceId(newTraceId);
    tracedFetch.current = createTracedFetch(newTraceId);

    setStatus("running");
    setError("");
    setResult(null);
    setPendingResult(null);
    setReviewDraft("");
    setReviewNote("");
    setProgress(0);
    setCurrentAgent("Analyzer");

    try {
      const res = await tracedFetch.current("/api/multi-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website_url: url,
          approvalState: reviewMode ? "pending" : "approved",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze website");
      }

      const data = (await res.json()) as AnalysisResult;
      setProgress(100);
      setCurrentAgent("");

      setTimeout(() => {
        const checkpoint = resolveReviewCheckpoint(data, reviewMode);
        if (checkpoint.status === "pending") {
          setPendingResult(checkpoint.pending);
          const strategist = checkpoint.pending.agents.find((a) => a.name === "Strategist");
          setReviewDraft(strategist?.recommendation ?? "");
          setStatus("pending_review");
        } else {
          setResult(checkpoint.approved);
          setStatus("done");
        }
      }, 350);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus("error");
    }
  };

  const handleApprovePending = () => {
    if (!pendingResult) return;
    const revised = reviewDraft.trim();
    const nextResult = revised
      ? {
          ...pendingResult,
          agents: pendingResult.agents.map((agent) =>
            agent.name === "Strategist" ? { ...agent, recommendation: revised } : agent
          ),
        }
      : pendingResult;
    setResult(nextResult);
    setPendingResult(null);
    setReviewNote("");
    setStatus("done");
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
    setPendingResult(null);
    setReviewDraft("");
    setReviewNote("");
    setStatus("idle");
  };

  const strategist = activeData?.agents.find((a) => a.name === "Strategist");
  const analyzer = activeData?.agents.find((a) => a.name === "Analyzer");
  const researcher = activeData?.agents.find((a) => a.name === "Researcher");

  return (
    <div className="min-h-screen bg-background text-foreground">
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
                Controlled multi-agent workflow with explicit human approval, traceable decisions, and executive-ready recommendations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["CrewAI", "Groq", "Human Approval", "Traceable Decisions"].map((item) => (
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
                disabled={status === "running"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && status !== "running") {
                    handleAnalyze();
                  }
                }}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLE_URLS.slice(0, 2).map((example) => (
                  <button
                    key={example}
                    onClick={() => setUrl(example)}
                    className="rounded-md border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                    disabled={status === "running"}
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
                onClick={handleAnalyze}
                disabled={status === "running" || !url.trim()}
                className="min-h-[44px] bg-blue-600 hover:bg-blue-700"
              >
                {status === "running" ? (
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
              <p className="text-xs text-muted-foreground">Trace ID: <span className={traceId ? 'font-mono text-blue-400' : 'text-slate-500'}>{traceId || '— run workflow to generate —'}</span></p>
            </div>
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

            {status === "running" && (
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
            {status === "pending_review" && pendingResult ? (
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
                    <Button onClick={handleApprovePending} className="min-h-[44px] min-w-[44px] px-6 py-3 bg-green-600 hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-400">
                      Approve
                    </Button>
                    <Button onClick={handleRegeneratePending} variant="outline" className="min-h-[44px] min-w-[44px] px-6 py-3 focus-visible:ring-2 focus-visible:ring-blue-400">
                      Revise
                    </Button>
                    <Button onClick={handleCancelPending} variant="outline" className="min-h-[44px] min-w-[44px] px-6 py-3 focus-visible:ring-2 focus-visible:ring-amber-400">
                      Cancel
                    </Button>
                  </div>

                  {reviewNote && <p className="text-xs text-muted-foreground">{reviewNote}</p>}
                </CardContent>
              </Card>
            ) : status === "done" && result ? (
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
            ) : status === "error" ? (
              <Card className="border-red-500/40 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-red-600 dark:text-red-300">Workflow Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  <Button
                    onClick={() => {
                      setStatus("idle");
                      setError("");
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
                <GovernancePillars compact />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
