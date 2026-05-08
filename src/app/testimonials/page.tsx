import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Testimonials } from '@/components/sections/Testimonials';
import { SITE_URL } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Testimonials & Recommendations — Prasad Kavuri',
  description: 'What engineering leaders, peers, and direct reports say about Prasad Kavuri’s AI platform leadership.',
  alternates: {
    canonical: `${SITE_URL}/testimonials`,
  },
};

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" />
          Back to portfolio
        </Link>

        <Testimonials />

        <div className="mt-12 text-center">
          <Link
            href="/for-recruiters"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Review Executive Brief
          </Link>
        </div>
      </div>
    </div>
  );
}
