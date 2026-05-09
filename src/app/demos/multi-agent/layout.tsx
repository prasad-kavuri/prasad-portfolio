export { metadata } from './metadata';
import { breadcrumbJsonLd } from '@/lib/breadcrumb';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: 'Demos', url: '/demos' },
            { name: 'Multi-Agent System', url: '/demos/multi-agent' },
          ]),
        }}
      />
      {children}
    </>
  );
}
