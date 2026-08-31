import PageTransition from "@/components/PageTransition";
import CursorDot from "@/components/CursorDot";
import Grain from "@/components/Grain";
import CinematicBackground from "@/components/CinematicBackground";
import Header from "@/components/Header";
import SectionNav from "@/components/SectionNav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Styles from "@/components/Styles";
import PortfolioGallery from "@/components/PortfolioGallery";
import Artists from "@/components/Artists";
import Process from "@/components/Process";
import Testimonials from "@/components/Testimonials";
import MultiStepBooking from "@/components/MultiStepBooking";
import FAQAccordion from "@/components/FAQAccordion";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <PageTransition>
      <Grain />
      <CursorDot />
      <CinematicBackground />
      <Header />
      <SectionNav autoMs={0} />

      <main className="relative z-10 snap-y-mandatory">
        <Hero />
        <About />
        <Styles />
        <PortfolioGallery />
        <Artists />
        <Process />
        <Testimonials />
        <MultiStepBooking />
        <FAQAccordion />
        <Footer />
      </main>
    </PageTransition>
  );
}