"use client";

import { useState, useEffect } from "react";
import { TOOL_REGISTRY, RegisteredTool } from "@/lib/registry";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Coins, 
  Activity, 
  Zap, 
  Lock, 
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface ToolMetric {
  availability: number;
  latency: number;
  finOpsEfficiency: number;
}

export function ToolRegistryPanel() {
  const [metrics, setMetrics] = useState<Record<string, ToolMetric>>({});

  useEffect(() => {
    // Simulate live metrics fetching
    const generateMetrics = () => {
      const newMetrics: Record<string, ToolMetric> = {};
      TOOL_REGISTRY.forEach(tool => {
        newMetrics[tool.id] = {
          availability: 99.1 + Math.random() * 0.8,
          latency: 150 + Math.random() * 450,
          finOpsEfficiency: 85 + Math.random() * 14
        };
      });
      setMetrics(newMetrics);
    };

    generateMetrics();
    const interval = setInterval(generateMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'enterprise': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'standard': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getCostColor = (tier: string) => {
    switch (tier) {
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-emerald-500 font-bold';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Live Tool Registry
        </h2>
        <p className="text-sm text-muted-foreground">
          Unified gateway for capability discovery, governance, and FinOps enforcement.
          Each tool is subject to global security policies and cost-routing guardrails.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TOOL_REGISTRY.map(tool => {
          const m = metrics[tool.id];
          return (
            <Card key={tool.id} className="p-4 bg-card border-border hover:border-blue-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{tool.name}</h3>
                    {m && m.availability > 99.5 ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Activity className="w-3 h-3 text-yellow-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{tool.type}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${getSecurityColor(tool.security_level)}`}>
                  {tool.security_level}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[32px]">
                {tool.description}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-border">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Availability
                  </p>
                  <p className="text-xs font-mono font-medium">
                    {m ? `${m.availability.toFixed(2)}%` : '--'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" /> FinOps Efficiency
                  </p>
                  <p className="text-xs font-mono font-medium text-blue-500">
                    {m ? `${m.finOpsEfficiency.toFixed(1)}%` : '--'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-1.5">
                  <Coins className={`w-3.5 h-3.5 ${getCostColor(tool.cost_tier)}`} />
                  <span className="text-[10px] font-medium uppercase">{tool.cost_tier} tier</span>
                </div>
                <Link 
                  href={tool.path}
                  className="text-[10px] font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  EXECUTE <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex gap-3">
          <Lock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Gateway Enforcement Active</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Global RBAC and cost-discipline policies are enforced at the Tool Gateway layer. 
              Any tool execution outside the registry is blocked by default (Deny-All posture).
              Real-time telemetry is piped to the Observability Feed as structured events.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
