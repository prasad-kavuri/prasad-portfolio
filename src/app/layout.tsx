import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const siteUrl = "https://www.prasadkavuri.com";
const personId = `${siteUrl}/#person`;
const websiteId = `${siteUrl}/#website`;
const krutrimId = `${siteUrl}/#organization-krutrim`;

const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "Prasad Kavuri",
      url: siteUrl,
      publisher: { "@id": personId },
      inLanguage: "en-US",
    },
    {
      "@type": "Person",
      "@id": personId,
      name: "Prasad Kavuri",
      jobTitle: "VP / Head of AI Engineering",
      description:
        "AI engineering executive leading agentic AI platforms, LLM orchestration, and enterprise AI transformation.",
      url: siteUrl,
      mainEntityOfPage: siteUrl,
      email: "vbkpkavuri@gmail.com",
      image: {
        "@type": "ImageObject",
        url: `${siteUrl}/profile-photo.jpg`,
        width: 400,
        height: 400,
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Naperville",
        addressRegion: "IL",
        addressCountry: "US",
      },
      sameAs: [
        "https://linkedin.com/in/pkavuri",
        "https://github.com/prasad-kavuri",
        "https://calendly.com/vbkpkavuri",
      ],
      worksFor: { "@id": krutrimId },
      alumniOf: [
        {
          "@type": "CollegeOrUniversity",
          name: "Northern Illinois University",
        },
        {
          "@type": "CollegeOrUniversity",
          name: "Osmania University",
        },
      ],
      knowsAbout: [
        "Agentic AI",
        "LLM Orchestration",
        "RAG Pipelines",
        "Enterprise AI",
        "AI Platform Architecture",
        "Multi-Agent Systems",
        "AI Governance",
      ],
      hasOccupation: {
        "@type": "Occupation",
        name: "AI Engineering Executive",
        occupationLocation: {
          "@type": "Country",
          name: "United States",
        },
        skills: [
          "AI platform architecture",
          "LLM orchestration",
          "RAG pipelines",
          "Global engineering leadership",
        ],
      },
    },
    {
      "@type": "Organization",
      "@id": krutrimId,
      name: "Krutrim",
      url: "https://olakrutrim.com/",
      sameAs: ["https://www.linkedin.com/company/krutrim"],
      description:
        "AI computing company where Prasad Kavuri serves as Head of AI Engineering.",
      employee: { "@id": personId },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.prasadkavuri.com"),
  title: "Prasad Kavuri — VP / Head of AI Engineering",
  description:
    "AI engineering executive leading 12 production AI systems across agentic workflows, LLM orchestration, and enterprise transformation. 20+ years experience, 200+ engineers led, India's first Agentic AI platform.",
  keywords: [
    "AI Engineering",
    "Agentic AI",
    "LLM Orchestration",
    "RAG Pipeline",
    "Multi-Agent Systems",
    "Head of AI Engineering",
    "AI Executive",
    "Krutrim",
    "Kruti.ai",
    "Prasad Kavuri",
    "Machine Learning",
    "GenAI",
    "Vector Search",
    "LLM Ops",
    "MLOps",
  ],
  authors: [{ name: "Prasad Kavuri", url: "https://www.prasadkavuri.com" }],
  creator: "Prasad Kavuri",
  openGraph: {
    title: "Prasad Kavuri — VP / Head of AI Engineering",
    description: "AI Engineering Executive. 12 production AI systems. 20+ years. 200+ engineers led. Open to VP/Head of AI Engineering roles.",
    url: "https://www.prasadkavuri.com",
    siteName: "Prasad Kavuri",
    images: [{ url: "https://www.prasadkavuri.com/profile-photo.jpg", width: 400, height: 400, alt: "Prasad Kavuri" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Prasad Kavuri — VP / Head of AI Engineering",
    description: "AI Engineering Executive. 12 production AI systems. 20+ years. Open to VP/Head of AI roles.",
    images: ["https://www.prasadkavuri.com/profile-photo.jpg"],
    creator: "@prasadkavuri",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.prasadkavuri.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(siteStructuredData).replace(/</g, "\\u003c"),
            }}
          />
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
