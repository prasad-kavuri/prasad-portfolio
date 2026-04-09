import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import profile from "@/data/profile.json";

interface SkillCategory {
  title: string;
  skills: string[];
  icon: string;
}

const categories: SkillCategory[] = [
  {
    title: "AI/ML Leadership",
    skills: profile.skills.ai_ml,
    icon: "🤖",
  },
  {
    title: "Cloud & Infrastructure",
    skills: profile.skills.cloud_infrastructure,
    icon: "☁️",
  },
  {
    title: "Executive Leadership",
    skills: profile.skills.leadership,
    icon: "👔",
  },
  {
    title: "Industry Expertise",
    skills: profile.skills.industry,
    icon: "🏢",
  },
];

export function Expertise() {
  return (
    <section id="expertise" className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-2 text-2xl font-semibold" style={{ color: 'var(--accent-brand)' }}>Core Expertise</h2>
        <p className="mb-10 text-muted-foreground">
          Deep expertise across AI/ML leadership, cloud infrastructure, executive
          leadership, and industry-specific domains.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <Card key={category.title} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <CardTitle className="text-base">{category.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
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
