import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Constrained Generative UI — Schema-Validated Components',
  description:
    "The model can only emit JSON for a fixed component catalog, validated server-side before anything renders. Ask about Prasad Kavuri's background.",
  alternates: { canonical: 'https://www.prasadkavuri.com/demos/generative-ui' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
