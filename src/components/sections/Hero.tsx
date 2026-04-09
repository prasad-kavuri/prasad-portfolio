import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import profile from "@/data/profile.json";

export function Hero() {
  return (
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
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
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
  );
}