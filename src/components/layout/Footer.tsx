import Link from "next/link";
import profile from "@/data/profile.json";
import { LinkedInCTA } from "@/components/ui/LinkedInCTA";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 text-sm text-muted-foreground">
        <LinkedInCTA href={profile.personal.linkedin} />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {new Date().getFullYear()} Prasad Kavuri</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end sm:gap-6">
          <Link href="/for-recruiters" className="hover:text-foreground">
            For Recruiters
          </Link>
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
          <Link href="/about" className="hover:text-foreground">
            About / Entity Profile
          </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
