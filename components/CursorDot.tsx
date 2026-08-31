"use client";
import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function CursorDot() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const leave = () => setVisible(false);
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  const spring = { damping: 28, stiffness: 380, mass: 0.4 };
  const x = useSpring(pos.x, spring);
  const y = useSpring(pos.y, spring);

  if (!visible) return null;

  return (
    <>
      <motion.div
        style={{ x: pos.x - 3, y: pos.y - 3 }}
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden h-1.5 w-1.5 rounded-full bg-parchment md:block"
      />
      <motion.div
        style={{ x, y }}
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-parchment/35 md:block"
      />
    </>
  );
}
