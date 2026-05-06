'use client';

import { FadeUp } from '@/components/ui/motion';

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  company: string;
  relationship: string;
  date: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Prasad is a strategic, technically astute, and highly influential leader who I would gladly work for or with again. His leadership is defined by exceptional attention to detail, which is crucial for managing complex engineering platform initiatives. He possesses remarkable creativity in navigating new technical challenges, consistently delivering innovative, practical solutions.",
    name: "Josh Lynn",
    title: "Senior Engineering Leader",
    company: "Krutrim",
    relationship: "Direct report",
    date: "December 2025",
  },
  {
    quote:
      "One common thing that particularly stands out is Prasad's ability to assemble high-performing teams that are always aligned towards delivering tangible business value. His commitment is evident in his deep involvement in shaping architecture, refining processes, devising comprehensive plans, and meticulously tracking KPIs. His approach isn't just about leadership on paper — it's about active engagement and dedicated guidance in every facet of a project.",
    name: "Anoop Kabra",
    title: "Director of Engineering",
    company: "HERE Technologies",
    relationship: "Peer · 15+ year colleague",
    date: "August 2023",
  },
  {
    quote:
      "Prasad is an extremely passionate leader who leads by example. Prasad has worked on various projects with varied degrees of complexity and it is really heartening to see how quickly he adapts to new challenges. A fantastic team player and a great mentor, Prasad has helped in shaping the career of hundreds of people who have worked with him.",
    name: "Subhendu Roy",
    title: "Sr. Director of Engineering",
    company: "HERE Technologies",
    relationship: "Cross-team peer",
    date: "January 2021",
  },
  {
    quote:
      "With his strongest desire to drive teams efficiently, he pays attention to each team and each team member's strength and weakness and delegates work accordingly. He is really passionate about using metrics and data to judge the success of any project. I highly recommend Prasad as a strong leader of people and technology to any organization.",
    name: "Syamkumar Abburi",
    title: "Senior Engineering Manager",
    company: "HERE Technologies",
    relationship: "Direct report",
    date: "November 2020",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4">

        <div className="mb-16">
          <span
            className="text-xs font-semibold tracking-widest uppercase mb-3 block"
            style={{ color: 'var(--accent-brand)' }}
          >
            Recommendations
          </span>
          <h2 className="text-3xl font-semibold mb-4">What People Say</h2>
          <p className="text-muted-foreground">
            From direct reports, peers, and cross-functional leaders across HERE Technologies and Krutrim.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {TESTIMONIALS.map((t, index) => (
            <FadeUp key={t.name + t.date} delay={index * 0.1}>
              <figure className="flex flex-col h-full border border-border rounded-xl p-6 bg-muted/20 hover:border-indigo-500/30 transition-colors">
                <blockquote className="flex-1 text-sm text-muted-foreground leading-relaxed mb-6">
                  <span className="text-2xl leading-none text-indigo-400/60 font-serif mr-1">&ldquo;</span>
                  {t.quote}
                  <span className="text-2xl leading-none text-indigo-400/60 font-serif ml-1">&rdquo;</span>
                </blockquote>
                <figcaption className="border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.title} · {t.company}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full border"
                      style={{ color: 'var(--accent-brand)', borderColor: 'var(--accent-brand)', opacity: 0.8 }}
                    >
                      {t.relationship}
                    </span>
                    <span className="text-xs text-muted-foreground">{t.date}</span>
                  </div>
                </figcaption>
              </figure>
            </FadeUp>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          Full recommendations on{' '}
          <a
            href="https://www.linkedin.com/in/pkavuri/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            LinkedIn
          </a>
        </p>
      </div>
    </section>
  );
}
