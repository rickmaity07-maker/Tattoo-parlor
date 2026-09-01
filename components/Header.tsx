"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isTryOn = pathname === "/try-on";
  const [active, setActive] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHome) return;
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
  }, [isHome]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    if (!isHome) {
      window.location.href = `/#${id}`;
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goHome = () => {
    setMenuOpen(false);
    if (!isHome) {
      window.location.href = "/";
      return;
    }
    go("hero");
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: isHome ? 1.2 : 0.15 }}
        className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 md:px-8 md:py-4">
          <button
            type="button"
            onClick={goHome}
            className="cursor-none shrink-0 font-display text-sm font-medium tracking-wide text-parchment"
          >
            Iron Rose
          </button>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => {
              const isActive = isHome && active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className={`cursor-none rounded-full px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-all xl:px-3 xl:text-[11px] ${
                    isActive
                      ? "bg-parchment/15 text-parchment shadow-[0_0_0_1px_rgba(237,230,217,0.25)]"
                      : "text-parchment/40 hover:text-parchment/75"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <a
              href="/try-on"
              className={`cursor-none rounded-full px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-all xl:px-3 xl:text-[11px] ${
                isTryOn
                  ? "bg-parchment/15 text-parchment shadow-[0_0_0_1px_rgba(237,230,217,0.25)]"
                  : "text-parchment/40 hover:text-parchment/75"
              }`}
            >
              Try-on
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/try-on"
              className={`cursor-none rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition lg:hidden min-h-[40px] min-w-[44px] inline-flex items-center justify-center ${
                isTryOn
                  ? "bg-parchment/15 text-parchment"
                  : "border border-parchment/25 text-parchment/70"
              }`}
            >
              Try-on
            </a>
            <button
              type="button"
              onClick={() => go("reserve")}
              className="cursor-none hidden rounded-full bg-parchment px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-void transition hover:bg-white sm:inline-flex min-h-[40px] items-center"
            >
              Reserve
            </button>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="cursor-none inline-flex h-11 w-11 items-center justify-center rounded-full border border-parchment/20 lg:hidden"
            >
              <span className="sr-only">Menu</span>
              <div className="flex w-4 flex-col gap-1.5">
                <span className={`block h-px w-full bg-parchment transition ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`} />
                <span className={`block h-px w-full bg-parchment transition ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-px w-full bg-parchment transition ${menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-void/95 backdrop-blur-md lg:hidden"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <div className="flex h-full flex-col px-6 pb-10 pt-24">
              <nav className="flex flex-1 flex-col gap-1">
                {NAV.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.id)}
                    className="cursor-none rounded-sm px-2 py-3.5 text-left font-display text-2xl text-parchment/90 transition active:bg-parchment/10"
                  >
                    {item.label}
                  </button>
                ))}
                <a
                  href="/try-on"
                  onClick={() => setMenuOpen(false)}
                  className="cursor-none rounded-sm px-2 py-3.5 font-display text-2xl text-parchment/90 transition active:bg-parchment/10"
                >
                  Try-on
                </a>
              </nav>
              <button
                type="button"
                onClick={() => go("reserve")}
                className="cursor-none mt-4 w-full rounded-full bg-parchment py-4 text-center text-[12px] font-medium uppercase tracking-[0.25em] text-void"
              >
                Reserve a session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}