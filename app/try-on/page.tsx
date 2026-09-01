import Header from "@/components/Header";
import CursorDot from "@/components/CursorDot";
import Grain from "@/components/Grain";
import VirtualTryOn from "@/components/VirtualTryOn";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Virtual Try-On — Iron Rose Tattoo Co.",
  description: "Upload a photo and place digital flash before your appointment.",
};

export default function TryOnPage() {
  return (
    <>
      <Grain />
      <CursorDot />
      <Header />
      <main className="relative z-10 min-h-screen bg-void">
        <VirtualTryOn />
      </main>
      <Footer />
    </>
  );
}