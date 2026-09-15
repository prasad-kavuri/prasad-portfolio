'use client';

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import profile from "@/data/profile.json";
import { Mail, ExternalLink, CalendarDays } from "lucide-react";
import { trackCalendlyClick, trackEmailClick } from "@/lib/analytics";
import { CALENDLY_URLS } from "@/lib/tracking";
import { LinkedInCta } from "@/components/ui/linkedin-cta";

export function Contact() {
  return (
    <section id="contact" className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold" style={{ color: 'var(--accent-brand)' }}>Let&apos;s Talk AI Strategy →</h2>
          <p className="mb-10 text-muted-foreground">
            If you&apos;re building an AI platform, scaling GenAI in the enterprise, or
            evaluating governance models — I&apos;d welcome the conversation.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <LinkedInCta href={profile.personal.linkedin} />

          <Link href={`mailto:${profile.personal.email}`} onClick={() => trackEmailClick()}>
            <Card interactive className="h-full">
              {/* eslint-disable-next-line shadcn/no-restyle -- p-4/gap-2 sizes this icon+label row tighter than CardContent's block default; moving it to a wrapper would change the shipped, visually-verified layout for no benefit */}
              <CardContent className="flex items-center gap-2 p-4">
                <Mail className="size-5 text-red-600" />
                <span>Email</span>
              </CardContent>
            </Card>
          </Link>

          <Link href={profile.personal.github} target="_blank" rel="noopener noreferrer">
            <Card interactive className="h-full">
              {/* eslint-disable-next-line shadcn/no-restyle -- see Email card above */}
              <CardContent className="flex items-center gap-2 p-4">
                <ExternalLink className="size-5" style={{ color: 'var(--accent-brand)' }} />
                <span>GitHub</span>
              </CardContent>
            </Card>
          </Link>

          <Link
            href={CALENDLY_URLS.footer}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCalendlyClick('footer')}
          >
            <Card interactive className="h-full">
              {/* eslint-disable-next-line shadcn/no-restyle -- see Email card above */}
              <CardContent className="flex items-center gap-2 p-4">
                <CalendarDays className="size-5" style={{ color: 'var(--accent-brand)' }} />
                <span>Book a Call</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-10 text-center">
          <p className="mb-2 text-sm text-muted-foreground">Portfolio</p>
          <Badge variant="secondary">{profile.personal.portfolio}</Badge>
        </div>
      </div>
    </section>
  );
}
