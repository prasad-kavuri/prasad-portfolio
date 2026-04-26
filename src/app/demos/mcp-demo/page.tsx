"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: string;
  duration_ms: number;
}

interface MCPResponse {
  query: string;
  toolsDiscovered: number;
  toolCallLog: ToolCall[];
  finalAnswer: string;
  totalDuration_ms: number;
}

export default function MCPDemoPage() {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<MCPResponse | null>(null);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [expandedToolIndex, setExpandedToolIndex] = useState<number | null>(null);

  const exampleQueries = [
    "Is Prasad a good fit for VP of AI Engineering?",
    "What are Prasad's cloud infrastructure skills?",
    "Show Krutrim achievements and metrics",
    "Compare Prasad's skills to a CTO role requiring: strategy, AI, cloud, leadership",
  ];

  const handleRunDemo = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);
    setMcpError(null);

    try {
      const res = await fetch("/api/mcp-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error("Failed to run MCP demo");

      const data = (await res.json()) as MCPResponse;
      setResponse(data);
    } catch (error) {
      console.error("[mcp-demo] fetch error:", error);
      setMcpError(error instanceof Error ? error.message : "Failed to run demo");
    } finally {
      setLoading(false);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'MCP Tool Demo',
    description: 'Model Context Protocol in action — watch an LLM discover and call tools to answer questions about Prasad\'s background.',
    keywords: 'MCP, Tool Use, Groq API',
    url: 'https://www.prasadkavuri.com/demos/mcp-demo',
    author: { '@type': 'Person', '@id': 'https://www.prasadkavuri.com/#person', name: 'Prasad Kavuri', url: 'https://www.prasadkavuri.com', sameAs: ['https://www.linkedin.com/in/pkavuri/', 'https://github.com/prasad-kavuri'] },
    about: { '@type': 'Thing', name: 'AI Engineering' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
            <h1 className="text-3xl font-bold">MCP Tool Demo</h1>
            <p className="text-muted-foreground mt-1">
              Model Context Protocol — watch an AI agent discover and call tools in real time
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Protocol Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <Card className="bg-card border-border p-6">
            <div className="text-muted-foreground text-sm font-medium mb-2">Tools</div>
            <div className="text-2xl font-bold">4 Available</div>
            <div className="text-muted-foreground text-xs mt-3 space-y-1">
              <div>• get_experience</div>
              <div>• search_skills</div>
              <div>• calculate_fit_score</div>
              <div>• get_achievements</div>
            </div>
          </Card>

          <Card className="bg-card border-border p-6">
            <div className="text-muted-foreground text-sm font-medium mb-2">Transport</div>
            <div className="text-2xl font-bold">HTTP</div>
            <div className="text-muted-foreground text-xs mt-3">JSON-RPC 2.0</div>
          </Card>

          <Card className="bg-card border-border p-6">
            <div className="text-muted-foreground text-sm font-medium mb-2">Standard</div>
            <div className="text-2xl font-bold">MCP</div>
            <div className="text-muted-foreground text-xs mt-3">Linux Foundation</div>
          </Card>
        </div>

        {/* Query Input Section */}
        <Card className="bg-card border-border p-6 mb-12">
          <label className="block text-sm font-medium text-muted-foreground mb-4">
            Ask anything about Prasad's fit for a role...
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., Is Prasad a good fit for VP of AI Engineering?"
            className="w-full bg-background border border-border rounded px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                handleRunDemo();
              }
            }}
          />

          {/* Example Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="px-3 py-1 bg-muted hover:bg-muted border border-border rounded text-xs text-muted-foreground transition-colors"
              >
                {example.substring(0, 30)}...
              </button>
            ))}
          </div>

          <Button
            onClick={handleRunDemo}
            disabled={loading || !query.trim()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              "Run with MCP Tools"
            )}
          </Button>
        </Card>

        {/* Groq error banner */}
        {mcpError && (
          <div className="rounded border border-yellow-400 bg-yellow-50 text-yellow-900 px-4 py-3 text-sm mb-6">
            ⚠️ Live model unavailable — Groq API may be rate-limited or temporarily down.
            The demo architecture and governance layer remain fully functional.
            <a href="/governance" className="underline ml-1">View platform status →</a>
          </div>
        )}

        {/* Results Section */}
        {response && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Tool Execution Log */}
            <Card className="bg-card border-border p-6">
              <h2 className="text-lg font-semibold mb-4">MCP Tool Execution Log</h2>
              {response.toolCallLog.length === 0 ? (
                <div className="text-muted-foreground text-sm py-8 text-center">
                  No tools were called for this query
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {response.toolCallLog.map((call, idx) => (
                    <div
                      key={idx}
                      className="bg-muted border border-border rounded p-4 animate-fade-in"
                      style={{
                        animationDelay: `${idx * 100}ms`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <code className="text-sm font-mono text-blue-400">
                            {call.tool}
                          </code>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {call.duration_ms}ms
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          setExpandedToolIndex(
                            expandedToolIndex === idx ? null : idx
                          )
                        }
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedToolIndex === idx ? "Hide" : "Show"} args &
                        result
                      </button>

                      {expandedToolIndex === idx && (
                        <div className="mt-3 space-y-2 text-xs">
                          <div className="bg-background rounded p-2 overflow-auto max-h-32">
                            <div className="text-foreground font-mono">
                              <strong>Input:</strong>
                              <pre>{JSON.stringify(call.args, null, 2)}</pre>
                            </div>
                          </div>
                          <div className="bg-background rounded p-2 overflow-auto max-h-32">
                            <div className="text-foreground font-mono">
                              <strong>Result:</strong>
                              <pre>{call.result.substring(0, 200)}...</pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Final Answer */}
            <Card className="bg-card border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Final Answer</h2>
              <div className="bg-muted rounded p-4 mb-6 max-h-96 overflow-y-auto">
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {response.finalAnswer}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {response.toolCallLog.length} tools called
                </span>
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  {response.totalDuration_ms}ms
                </Badge>
              </div>
            </Card>
          </div>
        )}

        {/* How MCP Works Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">How MCP Works</h2>
          <div className="flex flex-col md:flex-row items-start gap-4">
            {/* Step 1 */}
            <Card className="flex-1 p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-medium">1</span>
                <h3 className="font-semibold">Discover</h3>
              </div>
              <p className="text-sm text-muted-foreground">Client requests tool list from MCP server. Agent learns what capabilities are available.</p>
            </Card>

            <div className="hidden md:flex items-center pt-5 text-muted-foreground">→</div>

            {/* Step 2 */}
            <Card className="flex-1 p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-medium">2</span>
                <h3 className="font-semibold">Select</h3>
              </div>
              <p className="text-sm text-muted-foreground">LLM chooses which tools to call based on the user query and tool descriptions.</p>
            </Card>

            <div className="hidden md:flex items-center pt-5 text-muted-foreground">→</div>

            {/* Step 3 */}
            <Card className="flex-1 p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-medium">3</span>
                <h3 className="font-semibold">Execute</h3>
              </div>
              <p className="text-sm text-muted-foreground">Tools run, results fed back to LLM for synthesis into a coherent final answer.</p>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
