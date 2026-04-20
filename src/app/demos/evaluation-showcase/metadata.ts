import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Evaluation Showcase',
  description:
    'Closed-loop AI quality system with offline evals, live drift signals, hallucination indicators, and CI regression gating.',
  alternates: {
    canonical: 'https://www.prasadkavuri.com/demos/evaluation-showcase',
  },
  openGraph: {
    title: 'AI Evaluation Showcase — Prasad Kavuri',
    description:
      'See regression-aware AI quality controls in action: LLM-as-Judge, drift monitoring, HITL checkpoints, and release gates.',
    url: 'https://www.prasadkavuri.com/demos/evaluation-showcase',
    images: [{ url: 'https://www.prasadkavuri.com/og-image.jpg', width: 1200, height: 630, alt: 'AI Evaluation Showcase' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Evaluation Showcase — Prasad Kavuri',
    description: 'Production-style AI quality loop: offline evals, drift signals, and regression gates.',
    images: ['https://www.prasadkavuri.com/og-image.jpg'],
  },
};
