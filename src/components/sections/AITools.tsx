'use client';

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demos } from "@/data/demos";
import { PORTFOLIO_FACTS } from "@/data/site-config";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bot, Building2, Cuboid, Database, Eye, FileText, GitBranch, MonitorCheck, Plug, Search, ShieldCheck, Users, Zap } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const statusLabel: Record<string, string> = {
  live: "Live",
  upgrading: "Upgrading",
  "coming-soon": "Soon",
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  live: "default",
  upgrading: "secondary",
  "coming-soon": "outline",
};

const DESKTOP_ONLY = ["quantization", "multimodal", "vector-search", "world-generation"];

const DEMO_GROUPS = [
  {
    label: "Core AI Infrastructure",
    description: "Foundation systems for scalable AI platforms",
    ids: ["evaluation-showcase", "rag-pipeline", "llm-router", "vector-search", "browser-native-ai-skill"]
  },
  {
    label: "Agentic Systems",
    description: "Autonomous agents and tool-use orchestration",
    ids: ["multi-agent", "mcp-demo", "enterprise-control-plane", "world-generation"]
  },
  {
    label: "AI Applications",
    description: "Production AI experiences across modalities",
    ids: ["portfolio-assistant", "resume-generator", "multimodal", "quantization"]
  }
];

const SIGNATURE_DEMO_ID = "evaluation-showcase";

const DEMO_ICONS: Record<string, LucideIcon> = {
  "evaluation-showcase": ShieldCheck,
  "rag-pipeline": Database,
  "llm-router": GitBranch,
  "vector-search": Search,
  "multi-agent": Users,
  "mcp-demo": Plug,
  "enterprise-control-plane": Building2,
  "world-generation": Cuboid,
  "browser-native-ai-skill": MonitorCheck,
  "portfolio-assistant": Bot,
  "resume-generator": FileText,
  "multimodal": Eye,
  "quantization": Zap,
};

export function AITools() {
  const signatureDemo = demos.find(d => d.id === SIGNATURE_DEMO_ID);

  return (
    <section id="tools" className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-2 text-2xl font-semibold" style={{ color: 'var(--accent-brand)' }}>
          AI-Powered Tools
        </h2>
        <p className="text-muted-foreground mb-2">
          {PORTFOLIO_FACTS.productionDemoCount} production demos — all running on shared governance
          infrastructure: guardrails, observability, evaluation, and
          drift monitoring at the platform layer.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          New to the platform?{' '}
          <Link href="/capabilities" className="inline-flex items-center gap-1 font-medium hover:underline" style={{ color: 'var(--accent-brand)' }}>
            → Platform Capabilities
          </Link>
          {' '}for a leadership-level map, then review the{' '}
          <Link href="/demos/evaluation-showcase" className="inline-flex items-center gap-1 font-medium hover:underline" style={{ color: 'var(--accent-brand)' }}>
            AI Evaluation Showcase
          </Link>
          {' '}to see the full governance pipeline, or browse the{' '}
          <Link href="/demos" className="font-medium hover:underline" style={{ color: 'var(--accent-brand)' }}>
            canonical demos index
          </Link>.
        </p>

        <div className="mb-8 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            How AI Quality Is Measured
          </p>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <p>Offline LLM-as-Judge eval cases with semantic fidelity scoring.</p>
            <p>Online drift snapshots with hallucination and anomaly indicators.</p>
            <p>Regression-aware quality gates designed for release readiness.</p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Local-First AI Demos
          </p>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <p>RAG, Vector Search, Multimodal, and Quantization run in-browser with client-side inference paths.</p>
            <p>This reduces server-side data exposure for demo workloads and showcases privacy-aware execution patterns.</p>
            <p>Trade-off is explicit: local execution improves privacy/cost posture, while server models handle heavier reasoning workloads.</p>
          </div>
        </div>

        {/* Signature System — featured above the demo grid */}
        {signatureDemo && (
          <Link
            href={signatureDemo.href}
            className="group block mb-12"
            onClick={() => trackEvent('demo_opened', { demo: signatureDemo.id, featured: 'true' })}
          >
            <div
              className="rounded-xl border-2 p-6 transition-all group-hover:shadow-lg"
              style={{ borderColor: 'var(--accent-brand)', background: 'var(--accent-brand)10' }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {(() => {
                    const SignatureIcon = DEMO_ICONS[signatureDemo.id];
                    return SignatureIcon ? <SignatureIcon className="size-6 text-muted-foreground" aria-hidden="true" /> : null;
                  })()}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                        Signature Quality System
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        Flagship Demo
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">{signatureDemo.title}</h3>
                  </div>
                </div>
                <Badge variant={statusVariant[signatureDemo.status]}>
                  {statusLabel[signatureDemo.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3 max-w-2xl">
                {signatureDemo.description} Demonstrates the quality loop recruiters and CTOs look for:
                offline eval coverage, online drift monitoring, hallucination indicators, and CI-ready
                regression gating.
              </p>
              <div className="flex flex-wrap gap-2">
                {signatureDemo.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
                    {tag}
                  </span>
                ))}
                <span className="text-xs px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                  Drift Monitoring
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                  Quality Gates
                </span>
              </div>
            </div>
          </Link>
        )}

        {DEMO_GROUPS.map((group) => {
          const groupDemos = demos.filter(d => group.ids.includes(d.id));
          return (
            <div key={group.label} className="mb-12">

              {/* Group header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-border" />
                <div className="text-center">
                  <span
                    className="text-xs font-semibold tracking-widest uppercase px-4"
                    style={{ color: 'var(--accent-brand)' }}
                  >
                    {group.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {group.description}
                  </p>
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Cards grid for this group */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupDemos.map((demo) => (
                  <Link key={demo.id} href={demo.href} className="group" onClick={() => trackEvent('demo_opened', { demo: demo.id })}>
                    <Card className="h-full transition-shadow group-hover:shadow-md">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          {(() => {
                            const DemoIcon = DEMO_ICONS[demo.id];
                            return DemoIcon ? <DemoIcon className="size-6 text-muted-foreground" aria-hidden="true" /> : null;
                          })()}
                          <div className="flex items-center gap-1.5">
                            {DESKTOP_ONLY.includes(demo.id) && (
                              <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                Desktop
                              </span>
                            )}
                            <Badge variant={statusVariant[demo.status]}>
                              {statusLabel[demo.status]}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-base">{demo.title}</CardTitle>
                        <p className="text-xs leading-snug text-muted-foreground">
                          {demo.businessImpact}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-2 text-sm text-muted-foreground">
                          {demo.description}
                        </p>
                        {demo.businessOutcome && (
                          <p className="mb-3 text-xs text-muted-foreground border-l-2 border-border pl-2 italic">
                            {demo.businessOutcome}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {demo.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {demo.skills && demo.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {demo.skills.map((skillId) => (
                              <span
                                key={skillId}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20"
                              >
                                {skillId.replace(/-/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                        <div
                          className="mt-3 flex items-center gap-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ color: 'var(--accent-brand)' }}
                        >
                          Open demo <ArrowRight className="size-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
}
