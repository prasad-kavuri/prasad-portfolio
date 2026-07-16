import { Badge } from '@/components/ui/badge';
import profile from '@/data/profile.json';

// ---------------------------------------------------------------------------
// Featured roles — full outcome narrative (top 4 from profile.json)
// ---------------------------------------------------------------------------

const OUTCOMES: Record<string, {
  situation: string;
  built: string;
  builtLabel?: string;
  metrics: { value: string; label: string }[];
}> = {
  zip: {
    situation:
      'Zip needed centralized AI platform capabilities to let AI agents, decision systems, and intelligent workflows operate safely and at scale across a regulated financial-services environment.',
    built:
      'Leading enterprise AI platform strategy and agentic AI capability development at Zip, partnering across Engineering, Product, Data, Risk, and Security to operationalize AI safely and responsibly at scale.',
    builtLabel: "What I'm Building",
    metrics: [],
  },
  krutrim: {
    situation:
      'India had no sovereign agentic AI platform. Krutrim (Ola Group) was starting from zero and needed to reach national production scale in months, not years.',
    built:
      'Kruti.ai — India\'s first multi-agent AI platform: multi-model LLM orchestration, RAG pipelines, vector search, domain-specific agents across mobility, payments, and commerce. Built and scaled a 200+ engineer global organization around it.',
    metrics: [
      { value: '300-seat', label: 'Call center automated' },
      { value: '50%',      label: 'Latency reduction' },
      { value: '40%',      label: 'Cost savings' },
      { value: '$10M+',    label: 'Revenue launched' },
    ],
  },
  ola: {
    situation:
      'Ola Maps was running on aging legacy infrastructure that couldn\'t support the B2B scale the business needed. API reliability was inconsistent and cloud costs were out of control.',
    built:
      'Full cloud-native platform transformation for Ola Maps — LLM-powered routing, real-time fleet optimization, and B2B API layer that could serve 13,000+ enterprise customers reliably at millions of daily calls.',
    metrics: [
      { value: '70%',   label: 'Infrastructure cost reduction' },
      { value: '13K+',  label: 'Enterprise customers' },
      { value: '35M+',  label: 'POIs indexed' },
      { value: '$8M–$15M', label: 'Budget directed' },
    ],
  },
  'here-head': {
    situation:
      'AI/ML infrastructure at HERE was siloed across teams with no unified platform layer. Autonomous driving programs at major OEMs needed reliable, safety-critical data pipelines.',
    built:
      'Unified AI/ML infrastructure serving the autonomous driving programs of major global OEMs — safety-critical, regulated, and globally distributed engineering.',
    metrics: [
      { value: 'Major OEMs', label: 'Autonomous driving supported' },
      { value: 'Global',     label: 'Engineering reach' },
    ],
  },
  'here-director': {
    situation:
      'HD mapping for autonomous driving needed AI uplift to improve precision and scale across global road networks. Teams across NA, Europe, and APAC needed coordinated delivery.',
    built:
      'AI-enhanced HD mapping and lane-level automation systems — led 2 years of global delivery across North America, Europe, and APAC for the world\'s leading OEM autonomous driving platforms.',
    metrics: [
      { value: '3 continents', label: 'Engineering teams led' },
      { value: '$10M–$20M',   label: 'Annual budget' },
      { value: '2 years',      label: 'Continuous delivery' },
    ],
  },
};

// Color accents cycling through featured roles
const ROLE_COLORS = [
  'border-emerald-500/50',
  'border-indigo-500/50',
  'border-violet-500/50',
  'border-blue-500/50',
  'border-teal-500/50',
];

const DOT_COLORS = [
  'bg-emerald-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-blue-500',
  'bg-teal-500',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Experience() {
  const featuredIds = ['zip', 'krutrim', 'ola', 'here-head', 'here-director'];
  const featuredExperiences = featuredIds
    .map(id => profile.experience.find(e => e.id === id))
    .filter(Boolean) as typeof profile.experience;

  const earlierExperiences = profile.experience.filter(
    e => !featuredIds.includes(e.id)
  );

  return (
    <section id="experience" className="py-20">
      <div className="mx-auto max-w-5xl px-4">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-brand)' }}>
            Leadership Timeline
          </p>
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            20 Years. Five Defining Transformations.
          </h2>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            From HERE Technologies&apos; AI/ML infrastructure for autonomous driving to India&apos;s first national-scale
            agentic AI platform, to leading AI Platform and Agentic Solutions at Zip — each role was a deliberate step into harder problems.
          </p>
        </div>

        {/* Featured role timeline */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-4 top-6 bottom-6 w-px bg-border hidden sm:block" aria-hidden />

          <div className="space-y-10">
            {featuredExperiences.map((exp, idx) => {
              const outcome = OUTCOMES[exp.id];
              const borderColor = ROLE_COLORS[idx] ?? 'border-border';
              const dotColor = DOT_COLORS[idx] ?? 'bg-muted';

              return (
                <div key={exp.id} className="sm:pl-12 relative">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-background hidden sm:block ${dotColor}`}
                    aria-hidden
                  />

                  {/* Role card */}
                  <div className={`rounded-xl border-l-4 border border-border bg-card overflow-hidden ${borderColor}`}>

                    {/* Role header */}
                    <div className="px-5 pt-5 pb-4 border-b border-border/60">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <p className="text-base font-semibold text-foreground">{exp.title}</p>
                          <p className="text-sm font-medium" style={{ color: 'var(--accent-brand)' }}>
                            {exp.company}
                          </p>
                          {'companyContext' in exp && exp.companyContext && (
                            <p className="text-xs text-muted-foreground/70 italic mt-0.5">{exp.companyContext}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground font-mono">{exp.period}</p>
                          {'duration' in exp && exp.duration && (
                            <p className="text-xs text-muted-foreground/60">{exp.duration}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Outcome narrative */}
                    {outcome && (
                      <div className={`px-5 py-4 grid gap-4 ${outcome.metrics.length > 0 ? 'sm:grid-cols-2' : ''}`}>
                        {/* Left: Situation + Built */}
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                              The Situation
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{outcome.situation}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                              {outcome.builtLabel ?? 'What I Built'}
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{outcome.built}</p>
                          </div>
                        </div>

                        {/* Right: Quantified outcomes — only shown once results are available */}
                        {outcome.metrics.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
                              Outcomes
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {outcome.metrics.map(m => (
                                <div
                                  key={m.label}
                                  className="rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                                >
                                  <p className="text-sm font-bold text-foreground leading-tight">{m.value}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{m.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    <div className="px-5 pb-4 flex flex-wrap gap-1">
                      {exp.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Earlier roles — compact strip */}
        {earlierExperiences.length > 0 && (
          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Prior Leadership at HERE Technologies
            </p>
            <div className="space-y-2">
              {earlierExperiences.map(exp => (
                <div
                  key={exp.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{exp.title}</span>
                    <span className="hidden sm:inline text-muted-foreground/40 mx-2">·</span>
                    <span className="block sm:inline text-xs text-muted-foreground">{exp.company}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {exp.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{exp.period}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
