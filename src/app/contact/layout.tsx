import type { Metadata } from 'next';
import { SITE_URL } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Contact Prasad Kavuri',
  description:
    'Get in touch with Prasad Kavuri, Director, AI Platform & Agentic Solutions at Zip, for AI strategy and platform leadership conversations.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: 'Contact Prasad Kavuri — Director, AI Platform & Agentic Solutions',
    description: 'Book a call, email, or connect on LinkedIn.',
    url: `${SITE_URL}/contact`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Prasad Kavuri — Director, AI Platform & Agentic Solutions',
    description: 'Book a call, email, or connect on LinkedIn.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact Prasad Kavuri',
            description: 'Get in touch with Prasad Kavuri, Director, AI Platform & Agentic Solutions at Zip.',
            url: `${SITE_URL}/contact`,
            mainEntity: {
              '@type': 'Person',
              '@id': `${SITE_URL}/#person`,
              name: 'Prasad Kavuri',
              jobTitle: 'Director, AI Platform & Agentic Solutions',
            },
          }).replace(/</g, '\\u003c'),
        }}
      />
      {children}
    </>
  );
}
