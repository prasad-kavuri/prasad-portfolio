import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Auth Demo — auth.md Registration and MCP Bearer Calls',
  description:
    'Live auth.md implementation: an AI agent registers anonymously, claims with email and OTP, then calls MCP tools with a Bearer credential.',
  alternates: { canonical: 'https://www.prasadkavuri.com/demos/agent-auth' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
