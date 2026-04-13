"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { resolveReviewCheckpoint } from "@/lib/hitl";
import { generateClientTraceId, createTracedFetch } from "@/lib/observability";

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

const AGENTS = [
  { name: "Analyzer", emoji: "🌐", role: "Technical site analysis" },
  { name: "Researcher", emoji: "🔍", role: "Best practices research" },
  { name: "Strategist", emoji: "🎯", role: "Action plan creation" },
];

const EXAMPLE_URLS = [
  "https://www.prasadkavuri.com",
  "https://github.com/prasad-kavuri",
  "https://openai.com",
  "https://anthropic.com",
];

export default function MultiAgentPage() {
  const [traceId] = useState(() => generateClientTraceId());
  const tracedFetch = useRef(createTracedFetch(traceId));
  const [url, setUrl] = useState<string>("https://www.prasadkavuri.com");
  const [status, setStatus] = useState<"idle" | "running" | "pending_review" | "done" | "error">("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pendingResult, setPendingResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [currentAgent, setCurrentAgent] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [reviewMode, setReviewMode] = useState(true);

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
    if (progress >= 33 && progress < 66 && currentAgent !== "Researcher") {
      setCurrentAgent("Researcher");
    } else if (progress >= 66 && currentAgent !== "Strategist") {
      setCurrentAgent("Strategist");
    } else if (progress < 33 && currentAgent !== "Analyzer") {
      setCurrentAgent("Analyzer");
    }
  }, [progress, currentAgent]);

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setStatus("running");
    setError("");
    setResult(null);
    setPendingResult(null);
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
          setStatus("pending_review");
        } else {
          setResult(checkpoint.approved);
          setStatus("done");
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus("error");
    }
  };

  const handleApprovePending = () => {
    if (!pendingResult) return;
    setResult(pendingResult);
    setPendingResult(null);
    setStatus("done");
  };

  const handleRegeneratePending = () => {
    setPendingResult(null);
    handleAnalyze();
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500/20 text-green-700 border-green-300";
    if (confidence >= 60) return "bg-yellow-500/20 text-yellow-700 border-yellow-300";
    return "bg-orange-500/20 text-orange-700 border-orange-300";
  };

  const getAgentStatus = (agentName: string) => {
    if (status !== "running") {
      if (status === "done") return "Done";
      return "Waiting";
    }
    if (currentAgent === agentName) return "Running";
    if (AGENTS.indexOf(AGENTS.find((a) => a.name === agentName)!) < AGENTS.indexOf(AGENTS.find((a) => a.name === currentAgent)!)) {
      return "Done";
    }
    return "Waiting";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Multi-Agent AI System</h1>
            <p className="text-muted-foreground mt-1">
              Three specialized AI agents collaborate to analyze websites and provide strategic recommendations
            </p>
            <label className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={reviewMode}
                onChange={(e) => setReviewMode(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Enable Review Mode</span>
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Agent Workflow Visualization */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Agent Workflow</h2>
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-2">
            {AGENTS.map((agent, idx) => (
              <div key={agent.name} className="flex items-center w-full md:w-auto">
                <Card className="flex-1 md:flex-none p-4 bg-card border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{agent.emoji}</span>
                    <div className="flex-1 md:flex-none">
                      <h3 className="font-semibold text-sm">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground">{agent.role}</p>
                    </div>
                    <Badge
                      className={`text-xs font-medium ${
                        getAgentStatus(agent.name) === "Running"
                          ? "bg-blue-500/20 text-blue-700 border-blue-300 animate-pulse"
                          : getAgentStatus(agent.name) === "Done"
                          ? "bg-green-500/20 text-green-700 border-green-300"
                          : "bg-gray-500/20 text-gray-700 border-gray-300"
                      } border`}
                    >
                      {getAgentStatus(agent.name)}
                    </Badge>
                  </div>
                </Card>
                {idx < AGENTS.length - 1 && (
                  idx === 1 && reviewMode ? (
                    /* HITL checkpoint marker between Researcher → Strategist */
                    <div className="hidden md:flex flex-col items-center px-2 gap-1">
                      <div className="text-muted-foreground text-sm">→</div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 whitespace-nowrap font-medium">
                          ✋ HITL
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">human review</span>
                      </div>
                      <div className="text-muted-foreground text-sm">→</div>
                    </div>
                  ) : (
                    <div className="hidden md:flex items-center px-2 text-muted-foreground">→</div>
                  )
                )}
              </div>
            ))}
          </div>
          {reviewMode && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              HITL Checkpoint — enterprise agents pause here for human review before the Strategist runs
            </p>
          )}
        </div>

        {/* URL Input Section */}
        <Card className="bg-card border-border p-6 mb-12">
          <label className="block text-sm font-medium text-muted-foreground mb-4">
            Website URL to Analyze
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a website URL..."
            className="w-full bg-background border border-border rounded px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500"
            disabled={status === "running"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && status !== "running") {
                handleAnalyze();
              }
            }}
          />

          {/* Example URLs */}
          <div className="flex flex-wrap gap-2 mt-4">
            {EXAMPLE_URLS.map((example) => (
              <button
                key={example}
                onClick={() => setUrl(example)}
                className="px-3 py-1 bg-muted hover:bg-muted/80 border border-border rounded text-xs text-muted-foreground transition-colors disabled:opacity-50"
                disabled={status === "running"}
              >
                {example.replace("https://", "")}
              </button>
            ))}
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={status === "running" || !url.trim()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {status === "running" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Start Multi-Agent Analysis
              </>
            )}
          </Button>
        </Card>

        {/* Progress Section */}
        {status === "running" && (
          <Card className="bg-card border-border p-6 mb-12">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Analysis Progress</span>
                <span className="text-xs text-muted-foreground">{Math.floor(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentAgent && (
                <>
                  {currentAgent} Agent
                  <span className="inline-block ml-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
                      .
                    </span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                      .
                    </span>
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-2">This may take 15-30 seconds...</p>
          </Card>
        )}

        {status === "pending_review" && pendingResult && (
          <Card className="bg-card border border-amber-500/40 p-6 mb-12">
            {/* HITL header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">✋</span>
              <h3 className="font-semibold text-amber-500">HITL Checkpoint — Human Review Required</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Enterprise agents pause here for human review. The Strategist will not run until you approve.
            </p>

            {/* Researcher findings summary */}
            {pendingResult.agents.find(a => a.name === "Researcher") && (() => {
              const researcher = pendingResult.agents.find(a => a.name === "Researcher")!;
              return (
                <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    🔍 Researcher findings — review before Strategist proceeds
                  </p>
                  <ul className="space-y-1 mb-3">
                    {researcher.findings.map((f, i) => (
                      <li key={i} className="text-sm text-foreground flex gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                    {researcher.recommendation}
                  </p>
                </div>
              );
            })()}

            {/* Stats + actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {pendingResult.agents.length} agents completed · {pendingResult.total_tokens.toLocaleString()} tokens · {(pendingResult.total_duration_ms / 1000).toFixed(1)}s
              </p>
              <div className="flex gap-2">
                <Button onClick={handleApprovePending} className="bg-green-600 hover:bg-green-700">
                  ✓ Approve — run Strategist
                </Button>
                <Button onClick={handleRegeneratePending} variant="outline">
                  Regenerate
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Results Section */}
        {status === "done" && result && (
          <div className="mb-12">
            {/* Summary Bar */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Total Duration:</span>
                <span className="text-sm font-semibold">{(result.total_duration_ms / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Total Tokens:</span>
                <span className="text-sm font-semibold">{result.total_tokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Agents:</span>
                <span className="text-sm font-semibold">{result.agents.length}</span>
              </div>
            </div>

            {/* Agent Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.agents.map((agent) => (
                <Card key={agent.name} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{agent.role}</p>
                      </div>
                      <Badge className={`text-xs ${getConfidenceBadgeColor(agent.confidence)} border`}>
                        {agent.confidence}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Findings */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Findings</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {agent.findings.map((finding, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-blue-500">•</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendation */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Recommendation</h4>
                      <div className="bg-muted rounded p-3 text-xs text-muted-foreground border border-border">
                        {agent.recommendation}
                      </div>
                    </div>

                    {/* Stats Footer */}
                    <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                      <span>{agent.duration_ms}ms</span>
                      <span>{agent.tokens} tokens</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Error Section */}
        {status === "error" && (
          <Card className="bg-red-500/10 border border-red-300 p-6 mb-12">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-red-700">Analysis Failed</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
              <Button
                onClick={() => {
                  setStatus("idle");
                  setError("");
                }}
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Benefits Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Why Multi-Agent AI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border p-6">
              <div className="text-2xl mb-3">🧠</div>
              <h3 className="font-semibold mb-2">Specialized Expertise</h3>
              <p className="text-sm text-muted-foreground">
                Each agent focuses on specific domains, providing targeted and accurate analysis from their area of expertise.
              </p>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="text-2xl mb-3">🤝</div>
              <h3 className="font-semibold mb-2">Collaborative Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                Agents build on each other's work, combining insights to create comprehensive recommendations.
              </p>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="text-2xl mb-3">📈</div>
              <h3 className="font-semibold mb-2">Scalable Architecture</h3>
              <p className="text-sm text-muted-foreground">
                New agents can be added seamlessly to handle additional analysis tasks and domains.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
