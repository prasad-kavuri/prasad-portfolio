'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const primaryLinks = [
  { href: "/for-recruiters", label: "For Recruiters" },
  { href: "/demos", label: "Demos" },
  { href: "#experience", label: "Experience" },
  { href: "/governance", label: "Governance" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/prasad-kavuri-vp-ai-engineering-2026.pdf", label: "Resume" },
  { href: "/contact", label: "Contact" },
];

// Architecture / platform deep-dive pages — grouped under one "Platform" menu
// instead of sitting inline, to keep the primary nav from overflowing.
const platformLinks = [
  { href: "/capabilities", label: "Capabilities" },
  { href: "/skills", label: "Skills Catalog" },
  { href: "/ai-runtime-engineering", label: "Runtime Engineering" },
  { href: "/ai-finops", label: "AI FinOps" },
  { href: "/enterprise-agent-runtime", label: "Agent Runtime" },
  { href: "/adaptive-ai-governance", label: "Adaptive Governance" },
  { href: "/enterprise-ai-operating-model", label: "Operating Model" },
];

const allLinksForMobile = [
  primaryLinks[0],
  primaryLinks[1],
  primaryLinks[2],
  ...platformLinks,
  ...primaryLinks.slice(3),
];

function PlatformMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Platform
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Platform pages"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur"
        >
          {platformLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap text-sm font-semibold"
          style={{ color: 'var(--accent-brand)' }}
        >
          Prasad Kavuri
        </Link>
        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 lg:flex">
          {primaryLinks.slice(0, 3).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <PlatformMenu />
          {primaryLinks.slice(3).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {/* Mobile hamburger — shown below the lg breakpoint since the full link set no longer fits at md */}
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {/* Mobile drawer */}
      {open && (
        <nav className="border-t bg-background/95 px-4 py-3 lg:hidden" aria-label="Mobile navigation">
          <ul className="flex flex-col gap-1">
            {allLinksForMobile.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
