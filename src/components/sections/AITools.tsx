'use client';

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demos } from "@/data/demos";
import { ArrowRight } from "lucide-react";
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

const DESKTOP_ONLY = ["quantization", "multimodal", "vector-search"];

const DEMO_GROUPS = [
  {
    label: "Core AI Infrastructure",
    description: "Foundation systems for scalable AI platforms",
    ids: ["llm-router", "rag-pipeline", "vector-search"]
  },
  {
    label: "Agentic Systems",
    description: "Autonomous agents and tool-use orchestration",
    ids: ["multi-agent", "mcp-demo"]
  },
  {
    label: "AI Applications",
    description: "Production AI experiences across modalities",
    ids: ["resume-generator", "portfolio-assistant", "multimodal", "quantization"]
  }
];

export function AITools() {
  return (
    <section id="tools" className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-2 text-2xl font-semibold" style={{ color: 'var(--accent-brand)' }}>
          AI-Powered Tools
        </h2>
        <p className="text-muted-foreground mb-4">
          These systems represent core architectural patterns used in
          enterprise AI deployments — not just demos, but production-ready
          implementations.
        </p>

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
                          <span className="text-2xl">{demo.emoji}</span>
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
                        <p className="mb-3 text-sm text-muted-foreground">
                          {demo.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {demo.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
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
