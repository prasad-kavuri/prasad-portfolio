import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import profile from "@/data/profile.json";

export function Hero() {
  return (
    <>
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
            <Image
              src="/profile-photo.jpg"
              alt={profile.personal.name}
              width={120}
              height={120}
              className="rounded-full object-cover ring-2 ring-border"
              priority
            />
            <div>
              <h1 className="mb-1 text-3xl font-semibold">
                {profile.personal.name}
              </h1>
              <p className="mb-3 text-lg text-muted-foreground">
                {profile.personal.title} · {profile.personal.subtitle}
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.personal.pills.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-8 max-w-2xl text-muted-foreground leading-relaxed">
            {profile.personal.summary}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#tools"
              className="inline-flex items-center rounded-lg px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent-brand)', color: 'var(--accent-brand-foreground)' }}
            >
              Explore AI Demos
            </a>
            <a
              href={profile.personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              View LinkedIn
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {profile.stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-muted p-4">
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-y border-border bg-muted/40 py-6">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left side — label */}
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
                For Recruiters & Hiring Managers
              </p>
              <p className="text-sm text-muted-foreground">
                Available for VP / Head of AI Engineering roles
              </p>
            </div>

            {/* Right side — buttons */}
            <div className="flex flex-wrap gap-3">
              <a
                href="/Prasad_Kavuri_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Resume
              </a>

              <a
                href="https://linkedin.com/in/pkavuri"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
                View LinkedIn
              </a>

              <a
                href="mailto:vbkpkavuri@gmail.com"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent-brand)', color: 'var(--accent-brand-foreground)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,12 2,6"/>
                </svg>
                Start a Conversation
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}