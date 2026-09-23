/** Long-form perspectives. Single source for the /perspectives index and the sitemap. */
export interface PerspectiveArticle {
  slug: string;
  title: string;
  summary: string;
  section: string;
  datePublished: string;
  readMinutes: number;
}

export const PERSPECTIVES: PerspectiveArticle[] = [
  {
    slug: 'why-enterprise-ai-stalls',
    title: 'Why Most Enterprise AI Initiatives Stall Before They Matter',
    summary: 'The pilots work. The demos impress. Then nothing ships to production. The problem is platform thinking, not technology.',
    section: 'Enterprise AI',
    datePublished: '2026-04-29',
    readMinutes: 3,
  },
  {
    slug: 'real-work-in-production-ai',
    title: 'The Real Work in Production AI Is Managing Tradeoffs, Not Selecting Models',
    summary: 'When running AI at scale, model selection is maybe 20% of the problem. The other 80% is system design.',
    section: 'Production AI',
    datePublished: '2026-04-29',
    readMinutes: 4,
  },
  {
    slug: 'agentic-ai-changes-how-work-gets-done',
    title: 'Agentic AI Changes More Than Your Tech Stack — It Changes How Work Gets Done',
    summary: 'Most of the conversation around agentic AI is still focused on the model layer. The more important shift is operational.',
    section: 'Agentic AI',
    datePublished: '2026-04-29',
    readMinutes: 4,
  },
];
