import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demos } from "@/data/demos";
import { ArrowRight } from "lucide-react";

const statusLabel: Record<string, string> = {
  live: "Live",
  upgrading: "Upgrading",
  "coming-soon": "Soon",
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  live: "default",
  upgrading: "secondary",
  "coming-soon": "outline",
};

export function AITools() {
  return (
    <section id="tools" className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-2 text-2xl font-semibold" style={{ color: 'var(--accent-brand)' }}>AI-Powered Tools</h2>
        <p className="mb-10 text-muted-foreground">
          Live demos showcasing agentic AI, semantic search, and open-source
          LLM orchestration.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((demo) => (
            <Link key={demo.id} href={demo.href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl">{demo.emoji}</span>
                    <Badge variant={statusVariant[demo.status]}>
                      {statusLabel[demo.status]}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{demo.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {demo.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {demo.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--accent-brand)' }}>
                    Open demo <ArrowRight className="size-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}