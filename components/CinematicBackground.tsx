"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IMG } from "@/lib/data";

const layers = [
  { id: "hero", src: IMG.hero },
  { id: "about", src: IMG.studio },
  { id: "work", src: IMG.processBack },
  { id: "artists", src: IMG.artistMono },
  { id: "process", src: IMG.handsClose },
  { id: "cta", src: IMG.studioDark },
];

export default function CinematicBackground() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const sections = document.querySelectorAll("[data-bg]");
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting && entry.target.getAttribute("data-bg"))
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const top = visible[0];
        if (!top) return;
        const id = top.target.getAttribute("data-bg");
        if (id) setActive(id);
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: "-12% 0px -12% 0px" }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <AnimatePresence mode="sync">
        {layers.map((layer) =>
          layer.id === active ? (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img
                src={layer.src}
                alt=""
                className="h-full w-full object-cover img-cinematic animate-drift"
              />
              <div className="absolute inset-0 bg-black/70" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />
              <div className="absolute inset-0 vignette-heavy" />
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
}