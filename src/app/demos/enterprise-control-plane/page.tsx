/**
 * Enterprise Control Plane Demo
 *
 * Architecture overview:
 *
 *  Browser UI
 *    ├── RBACPanel           → /api/enterprise-sim?resource=permissions
 *    ├── SpendAnalyticsPanel → /api/enterprise-sim?resource=spend|usage
 *    ├── TokenUsageChart     → /api/enterprise-sim?resource=tokens
 *    └── ObservabilityFeed   → /api/enterprise-sim?resource=events|summary
 *
 *  /api/enterprise-sim (Next.js Route Handler)
 *    └── src/lib/enterpriseMockData.ts  (seeded deterministic data)
 *
 *  Real-world equivalent:
 *    Browser UI → Anthropic Analytics API + OTEL collector → SIEM (Splunk/Cribl)
 *
 *  References:
 *    - https://claude.com/blog/cowork-for-enterprise
 *    - https://support.claude.com/en/articles/13694757-access-engagement-and-adoption-data-with-the-analytics-api
 *    - https://claude.com/docs/cowork/monitoring
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { RBACPanel } from "@/components/enterprise/RBACPanel";
import { SpendAnalyticsPanel } from "@/components/enterprise/SpendAnalyticsPanel";
import { ObservabilityFeed } from "@/components/enterprise/ObservabilityFeed";
import { TokenUsageChart } from "@/components/enterprise/TokenUsageChart";
import type { TeamPermissions, TeamSpendConfig, UsageMetrics, DailyTokenUsage, OtelEvent, OrgSummary } from "@/components/enterprise/types";

type TabId = 'rbac' | 'spend' | 'observability';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

interface LoadState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(url: string): LoadState<T> & { reload: () => void } {
  const [state, setState] = useState<LoadState<T>>({ data: null, loading: true, error: null });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(prev => ({ ...prev, loading: true, error: null }));
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ data: T }>;
      })
      .then(json => { if (!cancelled) setState({ data: json.data, loading: false, error: null }); })
      .catch(err => { if (!cancelled) setState({ data: null, loading: false, error: err.message }); });
    return () => { cancelled = true; };
  }, [url, revision]);

  return { ...state, reload: () => setRevision(r => r + 1) };
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="bg-red-500/10 border-red-300 p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-red-600">{message}</p>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-3 h-3 mr-1" /> Retry
        </Button>
      </div>
    </Card>
  );
}

export default function EnterpriseControlPlanePage() {
  const [activeTab, setActiveTab] = useState<TabId>('rbac');
  const [archOpen, setArchOpen] = useState(false);

  // Data fetches
  const permissions = useFetch<TeamPermissions[]>('/api/enterprise-sim?resource=permissions');
  const spend       = useFetch<TeamSpendConfig[]>('/api/enterprise-sim?resource=spend');
  const usage       = useFetch<UsageMetrics[]>('/api/enterprise-sim?resource=usage&period=30d');
  const tokens      = useFetch<DailyTokenUsage[]>('/api/enterprise-sim?resource=tokens&days=30');
  const events      = useFetch<OtelEvent[]>('/api/enterprise-sim?resource=events&limit=50');
  const summary     = useFetch<OrgSummary>('/api/enterprise-sim?resource=summary&period=30d');

  const TABS: { id: TabId; label: string }[] = [
    { id: 'rbac',          label: 'Access Control' },
    { id: 'spend',         label: 'Spend & Tokens' },
    { id: 'observability', label: 'Observability' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header */}
      <div className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-2 mb-3">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Enterprise Control Plane</h1>
          <p className="text-muted-foreground mt-1">
            Org-wide AI governance — access control, spend management, and OpenTelemetry observability
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Hero */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-3 max-w-2xl">
            A simulated enterprise admin dashboard demonstrating the governance layer for org-wide AI deployment.
            Maps directly to Anthropic&apos;s Cowork for Enterprise controls — RBAC, budget enforcement, and real-time OTEL event streaming.
          </p>
          <div className="flex flex-wrap gap-2">
            {['RBAC', 'Spend Governance', 'OTEL Observability'].map(badge => (
              <span key={badge} className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-300/30">
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Org Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {summary.loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : summary.error ? (
            <div className="col-span-5">
              <ErrorCard message={`Summary: ${summary.error}`} onRetry={summary.reload} />
            </div>
          ) : summary.data ? (() => {
            const s = summary.data;
            const cards = [
              { label: 'Total Teams',      value: String(s.totalTeams) },
              { label: 'Active Users',     value: String(s.totalActiveUsers) },
              { label: 'Cowork Sessions',  value: formatNumber(s.totalCoworkSessions) },
              { label: 'Tokens (30d)',     value: formatNumber(s.totalTokens) },
              { label: 'Est. Cost (30d)',  value: formatUSD(s.totalEstimatedCostUSD) },
            ];
            return cards.map(c => (
              <Card key={c.label} className="bg-card border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                <p className="text-2xl font-bold">{c.value}</p>
              </Card>
            ));
          })() : null}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div
            role="tablist"
            className="flex border-b border-border"
            onKeyDown={e => {
              const idx = TABS.findIndex(t => t.id === activeTab);
              let newIdx = idx;
              if (e.key === 'ArrowRight') newIdx = (idx + 1) % TABS.length;
              else if (e.key === 'ArrowLeft') newIdx = (idx - 1 + TABS.length) % TABS.length;
              else return;
              e.preventDefault();
              setActiveTab(TABS[newIdx].id);
              const buttons = e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]');
              buttons[newIdx]?.focus();
            }}
          >
            {TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveTab(tab.id); }}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Access Control */}
        {activeTab === 'rbac' && (
          <div role="tabpanel">
            {permissions.loading && (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading permissions...
              </div>
            )}
            {permissions.error && <ErrorCard message={permissions.error} onRetry={permissions.reload} />}
            {permissions.data && <RBACPanel teams={permissions.data} />}
          </div>
        )}

        {/* Tab: Spend & Tokens */}
        {activeTab === 'spend' && (
          <div role="tabpanel" className="space-y-6">
            {(spend.loading || usage.loading) && (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading spend data...
              </div>
            )}
            {(spend.error || usage.error) && (
              <ErrorCard
                message={spend.error ?? usage.error ?? 'Failed to load'}
                onRetry={() => { spend.reload(); usage.reload(); }}
              />
            )}
            {spend.data && usage.data && (
              <SpendAnalyticsPanel spendConfigs={spend.data} usageMetrics={usage.data} />
            )}
            {tokens.loading && (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading token data...
              </div>
            )}
            {tokens.error && <ErrorCard message={tokens.error} onRetry={tokens.reload} />}
            {tokens.data && (
              <TokenUsageChart
                dailyData={tokens.data}
                allTeamsData={tokens.data}
                teamOptions={['all', ...(usage.data ?? []).map(m => m.teamId)]}
              />
            )}
          </div>
        )}

        {/* Tab: Observability */}
        {activeTab === 'observability' && (
          <div role="tabpanel">
            {events.loading && (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading events...
              </div>
            )}
            {events.error && <ErrorCard message={events.error} onRetry={events.reload} />}
            {events.data && <ObservabilityFeed events={events.data} />}
          </div>
        )}

        {/* Architecture note */}
        <div className="mt-16 border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setArchOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors"
            aria-expanded={archOpen}
          >
            <span className="text-sm font-semibold">How this maps to real enterprise deployment</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${archOpen ? 'rotate-180' : ''}`} />
          </button>
          {archOpen && (
            <div className="px-5 py-4 text-sm text-muted-foreground space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Analytics API</strong> → This dashboard reads from <code>/api/enterprise-sim</code>, which mirrors the Anthropic Analytics API shape</li>
                <li><strong>OTEL events</strong> → The observability feed maps to a real OTEL collector → SIEM pipeline (Splunk/Cribl)</li>
                <li><strong>SCIM</strong> → Teams marked &quot;SCIM provisioned&quot; would sync from Okta/Azure AD in production</li>
                <li><strong>Per-connector permissions</strong> → Each connector maps to an MCP server with enforced read/write/delete ACLs</li>
                <li><strong>Token cost tracking</strong> → Uses Anthropic&apos;s <code>usage_metadata</code> response fields: <code>input_tokens</code>, <code>output_tokens</code>, <code>cache_read_input_tokens</code></li>
              </ul>
              <p className="pt-2">
                <a
                  href="https://claude.com/docs/cowork/monitoring"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-xs"
                >
                  Anthropic OpenTelemetry monitoring docs →
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
