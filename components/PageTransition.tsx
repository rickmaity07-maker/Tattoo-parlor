"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <motion.div
        initial={{ y: "0%" }}
        animate={{ y: loaded ? "-100%" : "0%" }}
        transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1], delay: 0.9 }}
        className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-[#030302]"
      >
        <motion.span
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="font-display text-2xl font-light tracking-wide text-[#E8E0D4] md:text-4xl"
        >
          Iron Rose
        </motion.span>
      </motion.div>
      {children}
    </>
  );
}
