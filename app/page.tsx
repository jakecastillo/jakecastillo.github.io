import { Header } from "@/components/portfolio/Header";
import { IconDefinitions } from "@/components/portfolio/IconDefinitions";
import { Hero } from "@/components/portfolio/Hero";
import { Overview } from "@/components/portfolio/Overview";
import { Work } from "@/components/portfolio/Work";
import { History } from "@/components/portfolio/History";
import { Toolkit } from "@/components/portfolio/Toolkit";
import { Approach } from "@/components/portfolio/Approach";
import { Contact } from "@/components/portfolio/Contact";
import { PortfolioMotion } from "@/components/portfolio/PortfolioMotion";

export default function Home() {
  return (
    <>
      <IconDefinitions />
      <a className="skip" href="#experience">
        Skip animation and read the overview
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Overview />
        <div className="experience-details">
          <Work />
          <History />
        </div>
        <Toolkit />
        <Approach />
      </main>
      <Contact />
      <PortfolioMotion />
    </>
  );
}
