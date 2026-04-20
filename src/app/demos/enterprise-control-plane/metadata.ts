import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enterprise Control Plane',
  description:
    'Enterprise AI governance control plane with RBAC, spend analytics, token observability, and OTEL event stream simulation.',
  alternates: {
    canonical: 'https://www.prasadkavuri.com/demos/enterprise-control-plane',
  },
  openGraph: {
    title: 'Enterprise Control Plane — Prasad Kavuri',
    description:
      'Review enterprise-grade AI controls for access, spend, auditability, and observability in one operating dashboard.',
    url: 'https://www.prasadkavuri.com/demos/enterprise-control-plane',
    images: [{ url: 'https://www.prasadkavuri.com/og-image.jpg', width: 1200, height: 630, alt: 'Enterprise Control Plane demo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enterprise Control Plane — Prasad Kavuri',
    description: 'RBAC, spend controls, token analytics, and observability for enterprise AI operations.',
    images: ['https://www.prasadkavuri.com/og-image.jpg'],
  },
};
