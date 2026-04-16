import Link from "next/link";
import profile from "@/data/profile.json";
import { LinkedInCta } from "@/components/ui/linkedin-cta";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Prasad Kavuri</p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end sm:gap-6">
          <LinkedInCta href={profile.personal.linkedin} className="h-9 px-3 py-1.5 text-xs sm:text-sm" />
          <Link href={profile.personal.github} target="_blank" className="hover:text-foreground">
            GitHub
          </Link>
          <Link href={`mailto:${profile.personal.email}`} className="hover:text-foreground">
            Email
          </Link>
          <Link href="/status" className="hover:text-foreground">
            System Status
          </Link>
          <Link href="/governance" className="hover:text-foreground">
            Governance
          </Link>
        </div>
      </div>
    </footer>
  );
}
