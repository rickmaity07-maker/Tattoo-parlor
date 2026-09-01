import Header from "@/components/Header";
import CursorDot from "@/components/CursorDot";
import Grain from "@/components/Grain";
import VirtualTryOn from "@/components/VirtualTryOn";
import Footer from "@/components/Footer";
import UnlockScroll from "@/components/UnlockScroll";

export const metadata = {
  title: "Virtual Try-On — Iron Rose Tattoo Co.",
  description: "Live arm tracking stencil preview with custom design upload.",
};

export default function TryOnPage() {
  return (
    <>
      <UnlockScroll />
      <Grain />
      <CursorDot />
      <Header />
      <main className="relative z-10 min-h-screen overflow-y-auto bg-void">
        <VirtualTryOn />
      </main>
      <Footer />
    </>
  );
}