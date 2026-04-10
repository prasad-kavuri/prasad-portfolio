import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { AITools } from "@/components/sections/AITools";
import { Transformation } from "@/components/sections/Transformation";
import { Expertise } from "@/components/sections/Expertise";
import { Experience } from "@/components/sections/Experience";
import { CaseStudies } from "@/components/sections/CaseStudies";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AITools />
        <Transformation />
        <Expertise />
        <Experience />
        <CaseStudies />
        <Contact />
      </main>
      <Footer />
    </>
  );
}