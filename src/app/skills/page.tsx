import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/theme-toggle';
import { SKILLS, getSkillCategories } from '@/data/skills';
import { SkillsCatalog } from './SkillsCatalog';

export const metadata: Metadata = {
  title: 'AI Skills Catalog',
  description:
    'Reusable capability modules powering every demo on this site — the orchestration substrate that makes models interchangeable and systems governable.',
};

export default function SkillsPage() {
  const categories = getSkillCategories();

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">AI Skills Catalog</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Reusable capability modules powering every demo on this site.
              This is the orchestration substrate — the layer that makes models
              interchangeable and systems governable.
            </p>
          </div>
        </div>

        <SkillsCatalog skills={SKILLS} categories={categories} />

        {/* Architecture note */}
        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Architecture Layer
          </h2>
          <pre className="text-sm font-mono leading-7 text-muted-foreground whitespace-pre">
{`Model (Claude / OpenAI / Gemma)
    ↓
Agent Orchestrator
    ↓
`}<span className="text-violet-400 font-semibold">Skills Layer  ← You are here</span>{`
    ↓
Tool Gateway
    ↓
User Interface`}
          </pre>
        </div>

      </div>
    </div>
  );
}
