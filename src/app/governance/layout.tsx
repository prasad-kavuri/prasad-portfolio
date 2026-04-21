import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Governance Dashboard',
  description:
    'Enterprise AI governance dashboard showing guardrails, HITL controls, telemetry, and operational risk posture for production AI systems.',
  alternates: {
    canonical: 'https://www.prasadkavuri.com/governance',
  },
  openGraph: {
    title: 'Governance Dashboard — Prasad Kavuri',
    description:
      'Governance and trust controls for enterprise AI operationalization: policy boundaries, eval posture, traceability, and oversight.',
    url: 'https://www.prasadkavuri.com/governance',
    images: [{ url: 'https://www.prasadkavuri.com/og-image.jpg', width: 1200, height: 630, alt: 'Governance dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Governance Dashboard — Prasad Kavuri',
    description: 'Enterprise AI governance evidence: guardrails, HITL, observability, and operational telemetry.',
    images: ['https://www.prasadkavuri.com/og-image.jpg'],
  },
};

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
