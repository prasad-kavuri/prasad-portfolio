import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Governance Dashboard',
  description:
    'Governance dashboard for enterprise AI operations: policy controls, quality signals, traceability, and cost posture.',
  alternates: {
    canonical: 'https://www.prasadkavuri.com/governance',
  },
  openGraph: {
    title: 'Governance Dashboard — Prasad Kavuri',
    description:
      'Enterprise AI trust controls and telemetry: guardrails, eval posture, hallucination risk, and trace-level accountability.',
    url: 'https://www.prasadkavuri.com/governance',
    images: [{ url: 'https://www.prasadkavuri.com/og-image.jpg', width: 1200, height: 630, alt: 'Governance dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Governance Dashboard — Prasad Kavuri',
    description: 'Policy controls, eval telemetry, and cost signals for production AI operations.',
    images: ['https://www.prasadkavuri.com/og-image.jpg'],
  },
};

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
