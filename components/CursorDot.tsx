"use client";
import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function CursorDot() {
  const [visible, setVisible] = useState(false);
  const x = useSpring(0, { stiffness: 400, damping: 35 });
  const y = useSpring(0, { stiffness: 400, damping: 35 });

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;

    setVisible(true);
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    const onChange = () => setVisible(fine.matches);
    fine.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("mousemove", move);
      fine.removeEventListener("change", onChange);
    };
  }, [x, y]);

  if (!visible) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-parchment/80 mix-blend-difference md:block"
      style={{ x, y }}
    />
  );
}