'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scheduleIdleTask } from "@/lib/client-scheduler";
import { runBrowserAuditChecks, type BrowserAuditCheckResult } from "@/lib/browser-ai-audit";

const SAMPLE_HTML = `<main>
  <h1>Checkout</h1>
  <img src="/hero.png">
  <button></button>
  <a href="/terms">Terms</a>
</main>`;

const SKILL_MANIFEST = {
  name: "Gemini Nano Accessibility Auditor",
  prompt: "Audit this page for WCAG accessibility issues and return actionable fixes with severity.",
  icon: "shield-check",
};

export default function BrowserNativeAISkillPage() {
  const [markup, setMarkup] = useState(SAMPLE_HTML);
  const [ran, setRan] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<BrowserAuditCheckResult[] | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");

  const checks = useMemo(() => auditResults ?? [], [auditResults]);
  const passed = checks.filter((c) => c.ok).length;
  const score = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 0;
  const manifestJson = JSON.stringify(SKILL_MANIFEST, null, 2);

  const runAudit = () => {
    setRan(true);
    setIsAuditing(true);
    const cancel = scheduleIdleTask(() => {
      setAuditResults(runBrowserAuditChecks(markup));
      setIsAuditing(false);
    }, 1500);
    return cancel;
  };

  const handleCopyManifest = async () => {
    try {
      await navigator.clipboard.writeText(manifestJson);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <ThemeToggle />
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Native Browser AI Skill</h1>
            <p className="text-muted-foreground mt-1">
              Accessibility and agent-readiness checks run locally in browser with no server-side inference egress.
            </p>
          </div>
        </div>

        <Card className="mb-6 p-5 border-border bg-card">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline">Runs in browser</Badge>
            <Badge variant="outline">Privacy-preserving</Badge>
            <Badge variant="outline">No model egress</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            This demo represents a reusable browser-native skill pattern for enterprise teams that need fast, private page-readiness checks before agent automation is enabled.
          </p>
        </Card>

        <Card className="p-5 border-border bg-card mb-6">
          <label htmlFor="markup-input" className="text-sm font-medium">
            Page Markup Input
          </label>
          <textarea
            id="markup-input"
            value={markup}
            onChange={(e) => setMarkup(e.target.value)}
            className="mt-2 w-full h-56 rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground"
            aria-label="Page markup input"
          />
          <div className="mt-4">
            <button
              type="button"
              onClick={runAudit}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
              disabled={isAuditing}
            >
              {isAuditing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-3.5 animate-spin" /> Running Local Skill Audit
                </span>
              ) : (
                "Run Local Skill Audit"
              )}
            </button>
          </div>
        </Card>

        <Card className="mb-6 border-border bg-card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">AI Skill Manifest</p>
            <button
              type="button"
              onClick={handleCopyManifest}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Copy AI Skill Manifest
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs text-foreground">
            {manifestJson}
          </pre>
          {copyStatus === "success" && (
            <p className="mt-2 text-xs text-emerald-500">Manifest copied to clipboard.</p>
          )}
          {copyStatus === "error" && (
            <p className="mt-2 text-xs text-red-500">Unable to copy manifest from this browser.</p>
          )}
        </Card>

        {ran && (
          <Card className="p-5 border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Skill Output
              </p>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span className="text-sm font-medium">Readiness Score: {score}%</span>
              </div>
            </div>
            {isAuditing && (
              <p className="mb-3 text-xs text-muted-foreground">
                Running local checks off the critical render path to keep UI responsive.
              </p>
            )}
            <div className="space-y-3">
              {checks.map((check) => (
                <div key={check.key} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{check.label}</p>
                    <Badge variant={check.ok ? "default" : "secondary"}>
                      {check.ok ? "Pass" : "Needs review"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{check.detail}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
