import type { Metadata } from 'next';
import { metadata as pageMetadata } from './metadata';
import { breadcrumbJsonLd } from '@/lib/breadcrumb';

export const metadata: Metadata = pageMetadata;

export default function EnterpriseControlPlaneLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: 'Demos', url: '/demos' },
            { name: 'Enterprise Control Plane', url: '/demos/enterprise-control-plane' },
          ]),
        }}
      />
      {children}
    </>
  );
}
