import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { certifications, ALL_TAGS, TIER_LABELS } from '@/data/certifications';
import { CertificationsHub } from './CertificationsHub';

export const metadata: Metadata = {
  title: 'Skills Intelligence Hub | Prasad Kavuri',
  description:
    '55+ certifications across Agentic AI, LLMOps, and executive leadership — tiered and filterable.',
  alternates: { canonical: 'https://www.prasadkavuri.com/certifications' },
};

export default function CertificationsPage() {
  const tier1Count = certifications.filter((c) => c.tier === 1).length;
  const tier2Count = certifications.filter((c) => c.tier === 2).length;
  const tier3Count = certifications.filter((c) => c.tier === 3).length;

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
            <h1 className="text-4xl font-bold">Skills Intelligence Hub</h1>
            <p className="text-muted-foreground mt-1">
              55+ certifications. Tiered by signal strength. Filterable by domain.
            </p>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold">
            ⭐ {tier1Count} Featured Certs
          </span>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold">
            {tier2Count} Core Competencies
          </span>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted/40 border border-border text-muted-foreground text-sm font-semibold">
            🏛️ {tier3Count} Legacy Roots
          </span>
        </div>

        <CertificationsHub
          certifications={certifications}
          allTags={ALL_TAGS}
          tierLabels={TIER_LABELS}
        />

      </div>
    </div>
  );
}
