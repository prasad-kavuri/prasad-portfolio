'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, ExternalLink, CalendarDays, ArrowLeft } from 'lucide-react';
import profile from '@/data/profile.json';
import { CALENDLY_URLS } from '@/lib/tracking';
import { trackCalendlyClick, trackEmailClick, trackLinkedInClick, trackEvent } from '@/lib/analytics';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" />
          Back to portfolio
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact</h1>
          <p className="text-xl text-muted-foreground">
            I&apos;m currently <span className="text-foreground font-semibold">Director, AI Platform &amp; Agentic Solutions at Zip</span>. Always happy to talk <span className="text-foreground font-semibold">AI platform strategy</span>.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 mb-12">
          <a
            href={CALENDLY_URLS.recruiters}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
            onClick={() => trackCalendlyClick('contact_page')}
          >
            <Card className="h-full border-indigo-500/20 bg-indigo-500/5 group-hover:border-indigo-500/40 transition-colors">
              <CardContent className="p-6">
                <CalendarDays className="w-8 h-8 text-indigo-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Book a 30-min Call</h3>
                <p className="text-sm text-muted-foreground">
                  The fastest way to connect for recruitment or strategy discussions.
                </p>
              </CardContent>
            </Card>
          </a>

          <a
            href={`mailto:${profile.personal.email}`}
            className="block group"
            onClick={() => trackEmailClick()}
          >
            <Card className="h-full border-border bg-card group-hover:border-foreground/20 transition-colors">
              <CardContent className="p-6">
                <Mail className="w-8 h-8 text-red-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Email</h3>
                <p className="text-sm text-muted-foreground">
                  {profile.personal.email}
                </p>
              </CardContent>
            </Card>
          </a>

          <a
            href={profile.personal.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
            onClick={() => trackLinkedInClick('contact_page')}
          >
            <Card className="h-full border-border bg-card group-hover:border-foreground/20 transition-colors">
              <CardContent className="p-6">
                <ExternalLink className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">LinkedIn</h3>
                <p className="text-sm text-muted-foreground">
                  View full profile and recommendations.
                </p>
              </CardContent>
            </Card>
          </a>

          <a
            href={profile.personal.github}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
            onClick={() => trackEvent('github_click', { placement: 'contact_page' })}
          >
            <Card className="h-full border-border bg-card group-hover:border-foreground/20 transition-colors">
              <CardContent className="p-6">
                <ExternalLink className="w-8 h-8 text-slate-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">GitHub</h3>
                <p className="text-sm text-muted-foreground">
                  Explore the source code for this portfolio and other AI experiments.
                </p>
              </CardContent>
            </Card>
          </a>
        </div>

        <section className="bg-muted/30 rounded-2xl p-8 border border-border">
          <h2 className="text-xl font-semibold mb-4">Availability</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <div>
                <p className="font-medium">Immediately Available</p>
                <p className="text-sm text-muted-foreground">For the right leadership opportunity.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <div>
                <p className="font-medium">Global Reach</p>
                <p className="text-sm text-muted-foreground">Open to remote-first roles or Chicago-based hybrid/onsite.</p>
              </div>
            </li>
          </ul>
        </section>

        <footer className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2026 Prasad Kavuri. All rights reserved.</p>
        </footer>
      </div>

    </div>
  );
}
