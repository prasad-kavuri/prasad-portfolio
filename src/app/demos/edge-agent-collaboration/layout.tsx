import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edge + Cloud Agent Collaboration — Browser PII Redaction',
  description:
    'Three-tier privacy-first pipeline: BERT NER redacts PII in the browser, the server re-checks the payload behind a single-use approval, and only the approved payload reaches the cloud model.',
  alternates: { canonical: 'https://www.prasadkavuri.com/demos/edge-agent-collaboration' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
