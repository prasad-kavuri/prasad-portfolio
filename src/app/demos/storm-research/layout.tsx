import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'STORM Research Agent — Multi-Perspective Research',
  description:
    'Multi-perspective research inspired by Stanford STORM: discover expert lenses, generate questions, research each angle and synthesise an executive brief.',
  alternates: { canonical: 'https://www.prasadkavuri.com/demos/storm-research' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
