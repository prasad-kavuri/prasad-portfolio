import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { AITools } from "@/components/sections/AITools";
import { Transformation } from "@/components/sections/Transformation";
import { Architecture } from "@/components/sections/Architecture";
import { Expertise } from "@/components/sections/Expertise";
import { Experience } from "@/components/sections/Experience";
import { CaseStudies } from "@/components/sections/CaseStudies";
import { Perspectives } from "@/components/sections/Perspectives";
import { Contact } from "@/components/sections/Contact";
import { SectionBridge } from "@/components/sections/SectionBridge";

const siteUrl = "https://www.prasadkavuri.com";

const homePageStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "@id": `${siteUrl}/#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
      ],
    },
    {
      "@type": ["WebPage", "ProfilePage"],
      "@id": `${siteUrl}/#webpage`,
      url: siteUrl,
      name: "Prasad Kavuri - VP / Head of AI Engineering",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#person` },
      mainEntity: { "@id": `${siteUrl}/#person` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${siteUrl}/profile-photo.jpg`,
      },
      breadcrumb: { "@id": `${siteUrl}/#breadcrumb` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["#profile-name", "#profile-summary"],
      },
      inLanguage: "en-US",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homePageStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />
      <main>
        <Hero />
        <AITools />
        <Transformation />
        <SectionBridge text="These principles are reflected in how I architect real enterprise AI systems." />
        <Architecture />
        <SectionBridge text="These systems represent that architecture in action — production implementations, not prototypes." />
        <Expertise />
        <SectionBridge text="Building these systems draws on six areas where I consistently create value." />
        <Experience />
        <SectionBridge text="Three of those roles became defining transformations — here's how they actually happened." />
        <CaseStudies />
        <SectionBridge text="These experiences shaped how I think about AI — and what I've learned along the way." />
        <Perspectives />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
