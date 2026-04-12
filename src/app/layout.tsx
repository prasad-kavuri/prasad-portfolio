import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://prasadkavuri.com"),
  title: {
    default: "Prasad Kavuri — VP / Head of AI Engineering",
    template: "%s | Prasad Kavuri",
  },
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
  authors: [{ name: "Prasad Kavuri", url: "https://prasadkavuri.com" }],
  creator: "Prasad Kavuri",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://prasadkavuri.com",
    siteName: "Prasad Kavuri",
    title: "Prasad Kavuri — VP / Head of AI Engineering",
    description:
      "AI engineering executive leading agentic AI platforms, LLM orchestration, and enterprise transformation. Live demos: RAG, Vector Search, LLM Router, Multi-Agent, MCP.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Prasad Kavuri — VP / Head of AI Engineering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prasad Kavuri — VP / Head of AI Engineering",
    description:
      "AI engineering executive. 9 live AI demos: RAG, Vector Search, LLM Router, Multi-Agent, MCP Tool Demo and more.",
    images: ["/og-image.jpg"],
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
    canonical: "https://prasadkavuri.com",
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
                url: "https://prasadkavuri.com",
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
                description:
                  "AI engineering executive with 20+ years experience. Built India's first Agentic AI platform. Leads 200+ engineers across agentic AI, LLM orchestration, RAG pipelines, and enterprise AI transformation.",
                knowsAbout: [
                  "Agentic AI",
                  "LLM Orchestration",
                  "RAG Pipelines",
                  "Multi-Agent Systems",
                  "Machine Learning",
                  "AI Platform Architecture",
                  "GenAI",
                  "Vector Search",
                  "LLMOps",
                  "MLOps",
                  "Enterprise AI Transformation",
                  "Model Context Protocol",
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