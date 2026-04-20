'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Skill, SkillCategory } from '@/data/skills';

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  Safety:        'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Governance:    'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Observability: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Evaluation:    'bg-green-500/10 text-green-400 border-green-500/20',
  Orchestration: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Memory:        'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

interface Props {
  skills: Skill[];
  categories: SkillCategory[];
}

export function SkillsCatalog({ skills, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<SkillCategory | 'All'>('All');

  const visible = activeCategory === 'All'
    ? skills
    : skills.filter((s) => s.category === activeCategory);

  return (
    <>
      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter by category">
        {(['All', ...categories] as (SkillCategory | 'All')[]).map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              activeCategory === cat
                ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skill cards grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {visible.map((skill) => (
          <div key={skill.id} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">

            {/* Name + category badge */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold leading-tight">{skill.name}</h2>
              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[skill.category]}`}>
                {skill.category}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground">{skill.description}</p>

            {/* Input / Output contract */}
            <div className="rounded-lg bg-muted/20 border border-border px-4 py-3 text-xs space-y-1.5">
              <div>
                <span className="font-semibold text-foreground">Input: </span>
                <span className="text-muted-foreground">{skill.inputContract}</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Output: </span>
                <span className="text-muted-foreground">{skill.outputContract}</span>
              </div>
            </div>

            {/* Source file */}
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted/40 border border-border font-mono text-xs text-muted-foreground">
                {skill.sourceFile}
              </span>
            </div>

            {/* Used in demos */}
            {skill.usedInDemos.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground font-medium">Used in:</span>
                {skill.usedInDemos.map((demoId) => (
                  <Link
                    key={demoId}
                    href={`/demos/${demoId}`}
                    className="inline-flex items-center px-2 py-0.5 rounded border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    {demoId}
                  </Link>
                ))}
              </div>
            )}

            {/* Production signal */}
            <p className="text-xs italic text-muted-foreground border-t border-border pt-3">
              <span className="not-italic">⚡</span> {skill.productionSignal}
            </p>

          </div>
        ))}
      </div>
    </>
  );
}
