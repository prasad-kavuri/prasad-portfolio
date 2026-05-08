import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Evaluation Showcase — LLM-as-Judge & Outcome Grading | Prasad Kavuri',
  description:
    'Production-grade AI quality system: LLM-as-Judge grader agents score every response, CI regression gates block quality drift, and drift monitoring catches model degradation. Built by VP of AI Engineering Prasad Kavuri.',
  alternates: {
    canonical: 'https://www.prasadkavuri.com/demos/evaluation-showcase',
  },
  openGraph: {
    title: 'AI Evaluation Showcase — LLM-as-Judge & Outcome Grading | Prasad Kavuri',
    description:
      'See automated outcome grading in action: grader agents, drift signals, HITL checkpoints, and CI release gates for production AI systems.',
    url: 'https://www.prasadkavuri.com/demos/evaluation-showcase',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Evaluation Showcase — LLM-as-Judge & Outcome Grading',
    description:
      'Grader agents, drift monitoring, and CI regression gates — production AI quality controls by VP of AI Engineering Prasad Kavuri.',
  },
};
