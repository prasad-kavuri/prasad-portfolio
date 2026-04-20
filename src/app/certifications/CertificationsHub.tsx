'use client';

import { useState } from 'react';
import type { Certification } from '@/data/certifications';

// ---------------------------------------------------------------------------
// Category color palettes
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  'Anthropic Specialist':    { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', icon: 'bg-orange-500/20 text-orange-300' },
  'Agentic Framework Master':{ bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', icon: 'bg-violet-500/20 text-violet-300' },
  'Executive AI Leader':     { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/30',  icon: 'bg-amber-500/20 text-amber-300'  },
  'LLM & Generative AI':     { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30',   icon: 'bg-blue-500/20 text-blue-300'    },
  'LLMOps & Engineering':    { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30',  icon: 'bg-green-500/20 text-green-300'  },
  'Product & Agile Strategy':{ bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/30',   icon: 'bg-pink-500/20 text-pink-300'    },
  'Legacy Infrastructure':   { bg: 'bg-muted/20',      text: 'text-muted-foreground', border: 'border-border', icon: 'bg-muted/40 text-muted-foreground' },
};

function palette(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['Legacy Infrastructure'];
}

// ---------------------------------------------------------------------------
// Icon placeholder
// ---------------------------------------------------------------------------
function CertIcon({ issuer, category, size = 64 }: { issuer: string; category: string; size?: number }) {
  const p = palette(category);
  const initials = issuer.split(/[\s.]+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const sz = size === 64 ? 'w-16 h-16 text-lg' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sz} rounded-xl flex items-center justify-center font-bold shrink-0 ${p.icon}`}>
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier 1 card (featured, large)
// ---------------------------------------------------------------------------
function FeaturedCertCard({ cert, visible }: { cert: Certification; visible: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const p = palette(cert.category);
  if (!visible) return null;
  return (
    <div
      className={`rounded-xl border ${p.border} ${p.bg} p-4 flex flex-col gap-3 cursor-pointer transition-shadow hover:shadow-md`}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-start gap-3">
        <CertIcon issuer={cert.issuer} category={cert.category} size={64} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${p.text}`}>{cert.issuer}</p>
          <p className="text-sm font-semibold text-foreground leading-snug">{cert.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{cert.date}</p>
        </div>
      </div>
      {expanded && (
        <p className="text-xs text-muted-foreground border-t border-border/50 pt-3 leading-relaxed">
          {cert.value_add}
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {cert.tags.map((tag) => (
          <span key={tag} className={`text-xs px-1.5 py-0.5 rounded border ${p.border} ${p.text} bg-transparent`}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier 2 compact row
// ---------------------------------------------------------------------------
function CompactCertRow({ cert, visible }: { cert: Certification; visible: boolean }) {
  if (!visible) return null;
  const p = palette(cert.category);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <CertIcon issuer={cert.issuer} category={cert.category} size={32} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug truncate">{cert.name}</p>
        <p className="text-xs text-muted-foreground">{cert.issuer} · {cert.date}</p>
      </div>
      <div className="hidden sm:flex flex-wrap gap-1 shrink-0 max-w-[180px]">
        {cert.tags.slice(0, 2).map((tag) => (
          <span key={tag} className={`text-xs px-1.5 py-0.5 rounded border ${p.border} ${p.text}`}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion section
// ---------------------------------------------------------------------------
function AccordionSection({
  label,
  certs,
  activeTag,
  defaultOpen = true,
}: {
  label: string;
  certs: Certification[];
  activeTag: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const visibleCerts = certs.filter(
    (c) => activeTag === 'All' || c.tags.includes(activeTag)
  );

  if (visibleCerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
            {visibleCerts.length}
          </span>
        </div>
        <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          {visibleCerts.map((cert) => (
            <CompactCertRow key={cert.name} cert={cert} visible />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main hub component
// ---------------------------------------------------------------------------
interface Props {
  certifications: Certification[];
  allTags: string[];
  tierLabels: Record<1 | 2 | 3, string>;
}

const TIER1_COLUMNS: Array<string> = [
  'Anthropic Specialist',
  'Agentic Framework Master',
  'Executive AI Leader',
];

const TIER2_SECTIONS: Array<string> = [
  'LLM & Generative AI',
  'LLMOps & Engineering',
  'Product & Agile Strategy',
];

export function CertificationsHub({ certifications, allTags, tierLabels }: Props) {
  const [activeTag, setActiveTag] = useState<string>('All');
  const [tier3Open, setTier3Open] = useState(false);

  const tier1 = certifications.filter((c) => c.tier === 1);
  const tier2 = certifications.filter((c) => c.tier === 2);
  const tier3 = certifications.filter((c) => c.tier === 3);

  const matchesTag = (cert: Certification) =>
    activeTag === 'All' || cert.tags.includes(activeTag);

  // Tier 1 column visibility
  const tier1VisibleByColumn = TIER1_COLUMNS.reduce<Record<string, boolean>>((acc, col) => {
    acc[col] = tier1.filter((c) => c.category === col).some(matchesTag);
    return acc;
  }, {});

  const anyTier1Visible = Object.values(tier1VisibleByColumn).some(Boolean);
  const anyTier3Visible = tier3.some(matchesTag);

  return (
    <div className="space-y-10">

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Filter by tag
        </p>
        <div className="flex flex-wrap gap-2">
          {(['All', ...allTags] as string[]).map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeTag === tag
                  ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                  : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tier 1 ─────────────────────────────────────────────────────── */}
      {anyTier1Visible && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">⭐</span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tier 1 — Featured Specializations
            </h2>
            <span className="text-xs text-muted-foreground">· {tierLabels[1]}</span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TIER1_COLUMNS.map((col) => {
              const colCerts = tier1.filter((c) => c.category === col);
              const anyVisible = colCerts.some(matchesTag);
              if (!anyVisible) return null;
              const p = palette(col);
              return (
                <div key={col}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${p.text}`}>
                    {col}
                  </p>
                  <div className="space-y-3">
                    {colCerts.map((cert) => (
                      <FeaturedCertCard
                        key={cert.name}
                        cert={cert}
                        visible={matchesTag(cert)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Tier 2 ─────────────────────────────────────────────────────── */}
      {(() => {
        const anyTier2Visible = tier2.some(matchesTag);
        if (!anyTier2Visible) return null;
        return (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Tier 2 — Core Competencies
              </h2>
              <span className="text-xs text-muted-foreground">· {tierLabels[2]}</span>
            </div>
            <div className="space-y-3">
              {TIER2_SECTIONS.map((section) => (
                <AccordionSection
                  key={section}
                  label={section}
                  certs={tier2.filter((c) => c.category === section)}
                  activeTag={activeTag}
                  defaultOpen
                />
              ))}
            </div>
          </section>
        );
      })()}

      {/* ── Tier 3 ─────────────────────────────────────────────────────── */}
      {anyTier3Visible && (
        <section>
          <button
            className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 hover:bg-muted/20 transition-colors"
            onClick={() => setTier3Open((o) => !o)}
          >
            <div className="flex items-center gap-2">
              <span>🏛️</span>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Tier 3 — Infrastructure Roots
              </h2>
              <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                {tier3.filter(matchesTag).length}
              </span>
            </div>
            <span className="text-muted-foreground text-sm">{tier3Open ? '▲' : '▼'}</span>
          </button>
          {tier3Open && (
            <div className="mt-3 rounded-xl border border-border bg-card px-5 py-4 space-y-1">
              <p className="text-xs text-muted-foreground italic mb-4">
                These certifications established the infrastructure foundation that now powers AI-native system design.
              </p>
              {tier3.filter(matchesTag).map((cert) => (
                <CompactCertRow key={cert.name} cert={cert} visible />
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
}
