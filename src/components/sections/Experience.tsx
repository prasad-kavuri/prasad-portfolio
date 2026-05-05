import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import profile from "@/data/profile.json";

export function Experience() {
  const displayedExperiences = profile.experience.slice(0, 4);

  return (
    <section id="experience" className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-2 text-2xl font-semibold" style={{ color: 'var(--accent-brand)' }}>Experience Highlights</h2>
        <p className="mb-10 text-muted-foreground">
          VP / Head of AI Engineering with 20+ years building production AI platforms at enterprise scale. Led 200+ engineers across Krutrim, Ola, and HERE Technologies. Delivered 70% infrastructure cost reduction, $10M+ revenue launched, and India&apos;s first agentic AI platform.
        </p>
        <div className="space-y-4">
          {displayedExperiences.map((exp) => (
            <Card
              key={exp.id}
              className="border-l-4 overflow-hidden"
              style={{ borderColor: 'var(--accent-brand)' }}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{exp.title}</CardTitle>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {exp.period}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {exp.company}
                  </p>
                  <p className="text-xs text-muted-foreground">{exp.location}</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="mb-3 space-y-1 text-sm text-muted-foreground">
                  {exp.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-1">
                  {exp.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
