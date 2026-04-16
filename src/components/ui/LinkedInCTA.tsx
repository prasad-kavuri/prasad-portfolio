import Link from "next/link";
import { cn } from "@/lib/utils";

interface LinkedInCTAProps {
  href: string;
  className?: string;
  heading?: string;
  description?: string;
  buttonLabel?: string;
}

export function LinkedInCTA({
  href,
  className,
  heading = "Open to Executive AI Engineering Conversations",
  description = "For recruiter and leadership outreach, connect directly on LinkedIn.",
  buttonLabel = "Connect with Prasad",
}: LinkedInCTAProps) {
  return (
    <section
      aria-label="LinkedIn executive call to action"
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/70 via-slate-900/55 to-slate-800/70 p-5 text-slate-100 shadow-xl shadow-black/15 backdrop-blur-md",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-300/80">Executive CTA</p>
          <h3 className="text-base font-semibold text-white sm:text-lg">{heading}</h3>
          <p className="text-sm text-slate-300/90">{description}</p>
        </div>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={buttonLabel}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4 fill-current"
          >
            <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5.001A2.5 2.5 0 0 0 4.98 3.5ZM3 9h4v12H3zM9 9h3.83v1.71h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.26c0-1.25-.02-2.86-1.74-2.86-1.74 0-2.01 1.36-2.01 2.77V21H9z" />
          </svg>
          <span>{buttonLabel}</span>
        </Link>
      </div>
    </section>
  );
}
