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
            { name: 'Governed Agent Platform', url: '/demos/governed-agent-platform' },
          ]),
        }}
      />
      {children}
    </>
  );
}
