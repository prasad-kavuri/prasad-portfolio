import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkedInCtaProps {
  href: string;
  className?: string;
  label?: string;
}

export function LinkedInCta({
  href,
  className,
  label = "Connect on LinkedIn",
}: LinkedInCtaProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted",
        className
      )}
      aria-label={label}
    >
      {/* eslint-disable-next-line shadcn/no-arbitrary-values -- #0A66C2 is LinkedIn's official brand blue, required exact for brand accuracy */}
      <ExternalLink className="size-4 text-[#0A66C2]" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
