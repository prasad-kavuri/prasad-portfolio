import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { AITools } from "@/components/sections/AITools";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AITools />
      </main>
      <Footer />
    </>
  );
}