'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scheduleIdleTask } from "@/lib/client-scheduler";
import { runBrowserAuditChecks, type BrowserAuditCheckResult } from "@/lib/browser-ai-audit";

const ACCESSIBILITY_AUDITOR_PROMPT = `You are an expert accessibility auditor. Analyze the current webpage and provide:
1. WCAG 2.2 violations (list each with severity: Critical/Major/Minor)
2. Color contrast failures with specific element selectors
3. Missing ARIA labels and roles
4. Keyboard navigation blockers
5. Screen reader compatibility issues

Format your response as a structured audit report with an Executive Summary first, then detailed findings grouped by severity. End with a prioritized remediation checklist.`;

const SAMPLE_HTML = `<main>
  <h1>Checkout</h1>
  <img src="/hero.png">
  <button></button>
  <a href="/terms">Terms</a>
</main>`;

const SKILL_MANIFEST = {
  name: "Gemini Nano Accessibility Auditor",
  version: "1.0",
  description: "WCAG 2.2 accessibility audit using on-device Gemini Nano — no server, no API key",
  prompt: `You are an expert accessibility auditor. Analyze the current webpage and provide:\n1. WCAG 2.2 violations (list each with severity: Critical/Major/Minor)\n2. Color contrast failures with specific element selectors\n3. Missing ARIA labels and roles\n4. Keyboard navigation blockers\n5. Screen reader compatibility issues\n\nFormat your response as a structured audit report with an Executive Summary first, then detailed findings grouped by severity. End with a prioritized remediation checklist.`,
  icon: "shield-check",
  trigger: "on-demand",
  privacy: "on-device — no data leaves the browser",
  manifest_snippet: JSON.stringify({
    "@context": "https://ai.google.dev/gemini-api/docs/chrome-extensions",
    "name": "Gemini Nano Accessibility Auditor",
    "version": "1.0",
    "model": "gemini-nano",
    "trigger": "on-demand",
    "privacy": "on-device"
  }, null, 2),
};

export default function BrowserNativeAISkillPage() {
  const [markup, setMarkup] = useState(SAMPLE_HTML);
  const [ran, setRan] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<BrowserAuditCheckResult[] | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ACCESSIBILITY_AUDITOR_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = ACCESSIBILITY_AUDITOR_PROMPT;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyManifest = async () => {
    try {
      await navigator.clipboard.writeText(manifestJson);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'Native Browser AI Skill',
    description: 'A reusable Chrome AI Skill that audits webpage accessibility using on-device Gemini Nano.',
    keywords: 'Chrome Prompt API, Gemini Nano, WASM',
    url: 'https://www.prasadkavuri.com/demos/browser-native-ai-skill',
    author: { '@type': 'Person', '@id': 'https://www.prasadkavuri.com/#person', name: 'Prasad Kavuri', url: 'https://www.prasadkavuri.com', sameAs: ['https://www.linkedin.com/in/pkavuri/', 'https://github.com/prasad-kavuri'] },
    about: { '@type': 'Thing', name: 'AI Engineering' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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

        {/* Copy Prompt CTA — lets recruiter try the prompt in their own Chrome */}
        <div className="mt-6 mb-6 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <p className="text-sm text-slate-400 mb-1 font-medium">
            Try it yourself in Chrome
          </p>
          <p className="text-xs text-slate-500 mb-3">
            Copy this prompt and paste it into your Chrome Gemini sidebar to run
            an accessibility audit on any webpage — no API key, no cloud, fully private.
          </p>
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
            }`}
            aria-label="Copy accessibility auditor prompt to clipboard"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copied to clipboard!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                </svg>
                Copy Prompt for Chrome
              </>
            )}
          </button>
        </div>

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
