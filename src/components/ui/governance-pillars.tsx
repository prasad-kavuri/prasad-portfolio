import { BadgeCheck, ClipboardList, Eye, Shield, UserCheck } from "lucide-react";

type Pillar = {
  id: "guardrails" | "human" | "quality" | "abuse" | "auditability";
  title: string;
  detail: string;
};

const PILLARS: Pillar[] = [
  {
    id: "guardrails",
    title: "Guardrails",
    detail: "Centralized prompt-injection and output safety checks across AI routes.",
  },
  {
    id: "human",
    title: "Human Oversight",
    detail: "Approval checkpoints on high-impact transitions before strategist output is released.",
  },
  {
    id: "quality",
    title: "Quality Loop",
    detail: "Offline eval suites plus online drift monitoring and hallucination indicators.",
  },
  {
    id: "abuse",
    title: "Abuse Protection",
    detail: "Upstash-backed rate limiting with privacy-preserving IP hashing.",
  },
  {
    id: "auditability",
    title: "Auditability",
    detail: "Decision traces and trace IDs are visible for end-to-end review.",
  },
];

const ICONS = {
  guardrails: Shield,
  human: UserCheck,
  quality: BadgeCheck,
  abuse: Eye,
  auditability: ClipboardList,
} as const;

export function GovernancePillars({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "grid gap-2 text-muted-foreground",
        compact ? "sm:grid-cols-2 lg:grid-cols-5 text-xs" : "sm:grid-cols-2 lg:grid-cols-5 text-xs",
        className,
      ].join(" ")}
    >
      {PILLARS.map((pillar) => {
        const Icon = ICONS[pillar.id];
        return (
          <p key={pillar.id} className="leading-relaxed">
            <Icon className="mr-1 inline size-3.5 align-text-bottom text-foreground/80" aria-hidden="true" />
            <span className="font-medium text-foreground">{pillar.title}:</span> {pillar.detail}
          </p>
        );
      })}
    </div>
  );
}

