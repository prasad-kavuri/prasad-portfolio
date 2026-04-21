import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { certifications, ALL_TAGS, TIER_LABELS } from '@/data/certifications';
import { CertificationsHub } from './CertificationsHub';

export const metadata: Metadata = {
  title: 'AI Certifications and Validation',
  description:
    'Curated certification evidence for enterprise AI leadership: recent 2025–2026 agentic/LLMOps signal first, foundations and legacy credentials preserved.',
  alternates: { canonical: 'https://www.prasadkavuri.com/certifications' },
  openGraph: {
    title: 'AI Certifications and Validation — Prasad Kavuri',
    description:
      'Recency-weighted certification view for AI platform leadership: featured AI credentials, LLMOps depth, and preserved legacy foundations.',
    url: 'https://www.prasadkavuri.com/certifications',
    images: [{ url: 'https://www.prasadkavuri.com/og-image.jpg', width: 1200, height: 630, alt: 'Prasad Kavuri certifications' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Certifications and Validation — Prasad Kavuri',
    description: 'Featured recent AI certifications with clear signal hierarchy for recruiters and search agents.',
    images: ['https://www.prasadkavuri.com/og-image.jpg'],
  },
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
            <h1 className="text-4xl font-bold">AI Certifications and Validation</h1>
            <p className="text-muted-foreground mt-1">
              Curated for recruiter clarity: recent AI signal first, foundations and legacy preserved.
            </p>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold">
            ⭐ {tier1Count} Featured / Recent AI
          </span>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold">
            {tier2Count} AI + Platform Foundations
          </span>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted/40 border border-border text-muted-foreground text-sm font-semibold">
            🏛️ {tier3Count} Legacy / Archive
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
