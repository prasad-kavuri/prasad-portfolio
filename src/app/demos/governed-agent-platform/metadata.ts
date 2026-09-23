import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Governed Agent Platform — A2A, MCP, Approval, Trajectory Eval | Prasad Kavuri',
  description:
    'One synthetic finance-ops task, end to end: discover an A2A v1.0 agent, authenticate, delegate, enforce per-tool policy at a gateway, pause for human approval, block poisoned data, trace every call, and gate a release on trajectory evaluation. Reference implementation by Prasad Kavuri.',
  alternates: { canonical: 'https://www.prasadkavuri.com/demos/governed-agent-platform' },
  openGraph: {
    title: 'Governed Agent Platform | Prasad Kavuri',
    description:
      'A2A v1.0 agent + MCP server + tool gateway + human approval + trajectory evaluation with canary rollback — a working reference implementation.',
    url: 'https://www.prasadkavuri.com/demos/governed-agent-platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Governed Agent Platform | Prasad Kavuri',
    description: 'Identity → registry → gateway → approval → trace → evaluation → release, on real A2A and MCP endpoints.',
  },
};
