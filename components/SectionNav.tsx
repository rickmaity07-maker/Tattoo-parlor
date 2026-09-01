"use client";
import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  "hero",
  "studio",
  "disciplines",
  "work",
  "artists",
  "process",
  "words",
  "reserve",
  "faq",
];

type Props = { autoMs?: number };

export default function SectionNav({ autoMs = 0 }: Props) {
  const indexRef = useRef(0);
  const locked = useRef(false);
  const [auto, setAuto] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)");
    setEnabled(fine.matches);
    const onChange = () => setEnabled(fine.matches);
    fine.addEventListener("change", onChange);
    return () => fine.removeEventListener("change", onChange);
  }, []);

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(SECTIONS.length - 1, i));
    const el = document.getElementById(SECTIONS[next]);
    if (!el) return false;
    indexRef.current = next;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  };

  useEffect(() => {
    if (!enabled) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const i = SECTIONS.indexOf(best.target.id);
        if (i >= 0) indexRef.current = i;
      },
      { threshold: 0.35, rootMargin: "-12% 0px -30% 0px" }
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onWheel = (e: WheelEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("textarea, input, select, [data-allow-scroll]")) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const nextId = SECTIONS[indexRef.current + dir];
      if (!nextId || !document.getElementById(nextId)) return;
      e.preventDefault();
      if (locked.current) return;
      locked.current = true;
      goTo(indexRef.current + dir);
      window.setTimeout(() => {
        locked.current = false;
      }, 850);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;
      if (locked.current) return;
      let dir = 0;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) dir = 1;
      if (["ArrowUp", "PageUp"].includes(e.key)) dir = -1;
      if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        goTo(SECTIONS.length - 1);
        return;
      }
      if (!dir) return;
      const nextId = SECTIONS[indexRef.current + dir];
      if (!nextId || !document.getElementById(nextId)) return;
      e.preventDefault();
      locked.current = true;
      goTo(indexRef.current + dir);
      window.setTimeout(() => {
        locked.current = false;
      }, 850);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !auto || autoMs <= 0) return;
    const id = window.setInterval(() => {
      if (locked.current) return;
      const next = indexRef.current + 1;
      if (next >= SECTIONS.length) goTo(0);
      else goTo(next);
    }, autoMs);
    return () => window.clearInterval(id);
  }, [auto, autoMs, enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] hidden items-center gap-2 md:flex">
      <button
        type="button"
        onClick={() => setAuto((v) => !v)}
        className={`cursor-none rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all ${
          auto
            ? "border-rose/60 bg-rose/20 text-parchment"
            : "border-parchment/20 text-parchment/45 hover:border-parchment/40"
        }`}
      >
        {auto ? "Auto on" : "Auto"}
      </button>
    </div>
  );
}