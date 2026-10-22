import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Marketplace — Browse Agents and Demos',
  description:
    "A browsable catalogue of the agents, protocols and demos in Prasad Kavuri's portfolio, grouped by capability, with links to run each one.",
  alternates: { canonical: 'https://www.prasadkavuri.com/agent-marketplace' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
