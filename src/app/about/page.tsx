import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/data/site-config';

const personId = `${SITE_URL}/#person`;
const aboutUrl = `${SITE_URL}/about`;
const linkedInUrl = 'https://www.linkedin.com/in/pkavuri/';
const githubUrl = 'https://github.com/prasad-kavuri';

const profileStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  '@id': `${aboutUrl}#profile-page`,
  url: aboutUrl,
  name: 'Prasad Kavuri — VP / Head of AI Engineering',
  description:
    'Canonical profile page for Prasad Kavuri, an AI engineering executive focused on production AI platforms, agentic AI, AI governance, AI FinOps, and enterprise adoption.',
  mainEntity: {
    '@type': 'Person',
    '@id': personId,
    name: 'Prasad Kavuri',
    jobTitle: 'VP / Head of AI Engineering',
    description:
      'AI engineering executive focused on production AI platforms, agentic AI, AI governance, AI FinOps, and enterprise adoption.',
    url: aboutUrl,
    sameAs: [
      linkedInUrl,
      githubUrl,
      SITE_URL,
      `${SITE_URL}/resume.md`,
      `${SITE_URL}/.well-known/ai-agent-manifest.json`,
    ],
    image: [`${SITE_URL}/profile-photo.jpg`, `${SITE_URL}/og-image.jpg`],
    knowsAbout: [
      'Agentic AI',
      'LLM orchestration',
      'RAG',
      'Vector search',
      'AI governance',
      'AI FinOps',
      'Enterprise AI platform engineering',
      'Multi-agent systems',
      'LLMOps',
      'Evaluation frameworks',
    ],
    hasOccupation: {
      '@type': 'Occupation',
      name: 'AI Engineering Executive',
    },
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'Northern Illinois University' },
      { '@type': 'CollegeOrUniversity', name: 'Osmania University' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'professional',
      email: 'vbkpkavuri@gmail.com',
      url: linkedInUrl,
    },
  },
};

export const metadata: Metadata = {
  title: 'About Prasad Kavuri',
  description:
    'Canonical executive profile for Prasad Kavuri, VP / Head of AI Engineering focused on production AI platforms, governance, AI FinOps, and enterprise adoption.',
  alternates: {
    canonical: aboutUrl,
  },
  openGraph: {
    title: 'About Prasad Kavuri — VP / Head of AI Engineering',
    description:
      'Canonical executive profile for production AI platform leadership, agentic AI, governance, and enterprise adoption.',
    url: aboutUrl,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'Prasad Kavuri AI engineering profile' }],
  },
};

const targetRoles = [
  'VP of AI Engineering',
  'Head of AI Engineering',
  'Senior Director, AI Platform',
  'Head of Applied AI',
  'VP, AI Platform Engineering',
];

const notPositionedFor = [
  'IC engineering roles',
  'Staff Engineer roles',
  'Principal Engineer roles',
  'Lead Engineer roles',
];

const proofPoints = [
  '200+ engineers led',
  '70%+ AI infrastructure cost reduction',
  '13,000+ B2B customers enabled',
  '13 production AI demos / platform patterns',
];

const canonicalLinks = [
  { href: '/for-recruiters', label: 'For Recruiters' },
  { href: '/capabilities', label: 'Capabilities' },
  { href: '/governance', label: 'Governance' },
  { href: '/demos', label: 'Demos' },
  { href: '/certifications', label: 'Certifications' },
  { href: '/api/resume-download', label: 'Resume (PDF)' },
  { href: '/resume.md', label: 'Resume Markdown' },
  { href: '/llms.txt', label: 'llms.txt' },
  { href: '/llms-full.txt', label: 'llms-full.txt' },
  { href: '/.well-known/ai-agent-manifest.json', label: 'AI Agent Manifest' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Canonical Entity Profile</p>
        <h1 className="mt-3 text-4xl font-bold">Prasad Kavuri</h1>
        <p className="mt-2 text-lg text-foreground">VP / Head of AI Engineering</p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
          AI Engineering Executive focused on production AI platforms, agentic AI, AI governance,
          AI FinOps, and enterprise adoption. Based in the Chicago area / Naperville, IL.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Email: <a className="underline" href="mailto:vbkpkavuri@gmail.com">vbkpkavuri@gmail.com</a></li>
              <li>LinkedIn: <a className="underline" href={linkedInUrl}>linkedin.com/in/pkavuri</a></li>
              <li>GitHub: <a className="underline" href={githubUrl}>github.com/prasad-kavuri</a></li>
              <li>Portfolio: <Link className="underline" href="/">www.prasadkavuri.com</Link></li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Proof Points</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {proofPoints.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Current Target Roles</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {targetRoles.map((role) => <li key={role}>{role}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Not Positioned For</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {notPositionedFor.map((role) => <li key={role}>{role}</li>)}
            </ul>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Canonical Links</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {canonicalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted/40">
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-8 max-w-3xl text-xs leading-5 text-muted-foreground">
          Structured data and entity files support disambiguation for recruiter and AI-agent discovery.
          Search engines decide independently whether to show rich results or Knowledge Panel features.
        </p>
        <p className="mt-4 text-xs text-muted-foreground/60">Profile last updated: April 2026</p>
      </section>
    </main>
  );
}
