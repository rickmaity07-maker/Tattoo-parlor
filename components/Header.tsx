"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const NAV = [
  { id: "studio", label: "Studio" },
  { id: "disciplines", label: "Disciplines" },
  { id: "work", label: "Work" },
  { id: "artists", label: "Artists" },
  { id: "process", label: "Process" },
  { id: "words", label: "Words" },
  { id: "reserve", label: "Reserve" },
];

export default function Header() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const ids = ["hero", ...NAV.map((n) => n.id), "faq"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { threshold: [0.25, 0.45, 0.6], rootMargin: "-15% 0px -35% 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1.8 }}
      className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <button
          onClick={() => go("hero")}
          className="cursor-none font-display text-sm font-medium tracking-wide text-parchment transition-opacity hover:opacity-80"
        >
          Iron Rose
        </button>

        <nav className="hidden items-center gap-1 md:flex lg:gap-2">
          {NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`cursor-none rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${
                  isActive
                    ? "bg-parchment/15 text-parchment shadow-[0_0_0_1px_rgba(237,230,217,0.25)]"
                    : "text-parchment/40 hover:text-parchment/75"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => go("reserve")}
          className={`cursor-none rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-all duration-300 ${
            active === "reserve"
              ? "bg-rose text-parchment"
              : "bg-parchment text-void hover:bg-parchment/90"
          }`}
        >
          Reserve
        </button>
      </div>
    </motion.header>
  );
}