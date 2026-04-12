import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.prasadkavuri.com"),
  title: "Prasad Kavuri — VP / Head of AI Engineering",
  description:
    "AI engineering executive leading agentic AI platforms, LLM orchestration, and enterprise transformation. 20+ years experience, 200+ engineers led, India's first Agentic AI platform.",
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
    description: "AI Engineering Executive. 20+ years. 200+ engineers led. Open to VP/Head of AI Engineering roles.",
    url: "https://www.prasadkavuri.com",
    siteName: "Prasad Kavuri",
    images: [{ url: "https://www.prasadkavuri.com/profile-photo.jpg", width: 400, height: 400, alt: "Prasad Kavuri" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Prasad Kavuri — VP / Head of AI Engineering",
    description: "AI Engineering Executive. 20+ years. Open to VP/Head of AI roles.",
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
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Person",
                name: "Prasad Kavuri",
                jobTitle: "VP / Head of AI Engineering",
                url: "https://www.prasadkavuri.com",
                email: "vbkpkavuri@gmail.com",
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
                worksFor: {
                  "@type": "Organization",
                  name: "Krutrim",
                },
                knowsAbout: [
                  "Agentic AI",
                  "LLM Orchestration",
                  "RAG Pipelines",
                  "Enterprise AI",
                  "AI Platform Architecture",
                ],
              }),
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