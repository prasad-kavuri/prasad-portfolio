'use client';

const VALUE_AREAS = [
  {
    number: "01",
    title: "AI Platform Strategy & Architecture",
    description: "Designing multi-model AI platforms that scale from prototype to production — LLM orchestration, RAG pipelines, vector search, and agentic systems built for enterprise reliability.",
    skills: ["Multi-Model Orchestration", "RAG Architecture", "Vector Search", "Agentic AI", "LLM Ops"],
    icon: "platform"
  },
  {
    number: "02",
    title: "Enterprise AI Operating Model",
    description: "Building the organizational structures, governance frameworks, and team capabilities that allow companies to run AI as a core business function — not as an isolated experiment.",
    skills: ["AI Governance", "Team Scaling", "Exec Alignment", "P&L Management", "Transformation Programs"],
    icon: "org"
  },
  {
    number: "03",
    title: "Agentic AI Systems",
    description: "Architecting autonomous, tool-using agent systems that execute real-world workflows — from domain-specific agents to multi-agent orchestration with human-in-the-loop controls.",
    skills: ["CrewAI", "LangGraph", "Tool Use", "MCP Integration", "Agent Orchestration"],
    icon: "agent"
  },
  {
    number: "04",
    title: "Cloud-Native Infrastructure",
    description: "Delivering 50–70% cost reductions through cloud-native architecture, Kubernetes-based microservices, and scalable API platforms that handle millions of daily requests.",
    skills: ["AWS", "Azure", "GCP", "Kubernetes", "API Platforms", "PaaS"],
    icon: "cloud"
  },
  {
    number: "05",
    title: "Global Engineering Leadership",
    description: "Leading distributed engineering organizations of 200+ across US, Europe, and India — from hiring and culture to delivery execution and cross-functional stakeholder management.",
    skills: ["200+ Engineers Led", "Global Teams", "Hiring & Culture", "Stakeholder Management"],
    icon: "leadership"
  },
  {
    number: "06",
    title: "AI-Native Product Development",
    description: "Shipping AI products that users and enterprises actually adopt — from India's first agentic AI platform to B2B mapping APIs serving 13,000+ enterprise customers.",
    skills: ["B2B SaaS", "Platform Products", "Enterprise APIs", "Product-Led Growth"],
    icon: "product"
  }
];

export function Expertise() {
  return (
    <section id="expertise" className="py-20">
      <div className="mx-auto max-w-5xl px-4">

        {/* Header */}
        <p className="text-xs font-semibold tracking-widest uppercase mb-3"
           style={{ color: 'var(--accent-brand)' }}>
          Where I Create Value
        </p>
        <h2 className="text-3xl font-semibold mb-4">
          What I Bring to an Organization
        </h2>
        <p className="text-muted-foreground mb-16 max-w-2xl">
          Six areas where I consistently drive impact — from technical architecture
          to organizational transformation.
        </p>

        {/* 2x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUE_AREAS.map((area) => (
            <div
              key={area.number}
              className="group rounded-xl border border-border p-6 hover:border-indigo-500/50 hover:shadow-sm transition-all duration-200"
            >
              {/* Number */}
              <p className="text-4xl font-bold mb-4 transition-colors"
                 style={{ color: 'var(--accent-brand)', opacity: 0.25 }}>
                {area.number}
              </p>

              {/* Title */}
              <h3 className="text-base font-semibold mb-3 leading-snug">
                {area.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {area.description}
              </p>

              {/* Skill tags */}
              <div className="flex flex-wrap gap-2">
                {area.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
