'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type CheckResult = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
};

const SAMPLE_HTML = `<main>
  <h1>Checkout</h1>
  <img src="/hero.png">
  <button></button>
  <a href="/terms">Terms</a>
</main>`;

function runChecks(input: string): CheckResult[] {
  const hasMain = /<main[\s>]/i.test(input);
  const hasNav = /<nav[\s>]/i.test(input);
  const imgWithoutAlt = /<img\b(?![^>]*\balt=)[^>]*>/i.test(input);
  const unlabeledButton = /<button\b[^>]*>\s*<\/button>/i.test(input);
  const hasTabIndex = /tabindex=/i.test(input);
  const hasAriaLabels = /aria-label=/i.test(input);

  return [
    {
      key: "landmarks",
      label: "Semantic landmarks",
      ok: hasMain || hasNav,
      detail: hasMain || hasNav ? "Core landmarks detected." : "Add <main> or <nav> landmarks.",
    },
    {
      key: "alt-text",
      label: "Image accessibility",
      ok: !imgWithoutAlt,
      detail: imgWithoutAlt ? "At least one image is missing alt text." : "Image alt coverage looks good.",
    },
    {
      key: "controls",
      label: "Interactive control labels",
      ok: !unlabeledButton,
      detail: unlabeledButton ? "Found a button with no accessible label." : "Buttons have visible/accessible labels.",
    },
    {
      key: "focus",
      label: "Keyboard and agent readiness",
      ok: hasTabIndex || hasAriaLabels || hasMain,
      detail: hasTabIndex || hasAriaLabels || hasMain
        ? "Structure supports keyboard and automation navigation."
        : "Add focus or ARIA metadata for resilient automation.",
    },
  ];
}

export default function BrowserNativeAISkillPage() {
  const [markup, setMarkup] = useState(SAMPLE_HTML);
  const [ran, setRan] = useState(false);

  const checks = useMemo(() => runChecks(markup), [markup]);
  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <ThemeToggle />
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Browser-Native AI Skill</h1>
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
              onClick={() => setRan(true)}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Run Local Skill Audit
            </button>
          </div>
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
