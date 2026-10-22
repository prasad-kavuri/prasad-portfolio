import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recruiter Dashboard — 5-Minute Evaluation Path',
  description:
    'A guided evaluation path for hiring teams: capabilities, the flagship governed agent platform, operating model, live governance telemetry, and a way to book a call with Prasad Kavuri.',
  alternates: { canonical: 'https://www.prasadkavuri.com/recruiter-dashboard' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
