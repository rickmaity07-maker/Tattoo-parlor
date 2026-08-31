"use client";
import { motion } from "framer-motion";

export default function BookingCTA() {
  return (
    <section data-bg="cta" className="relative z-10 py-40 md:py-56">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl font-light tracking-tight text-[#E8E0D4] md:text-6xl"
        >
          By appointment
        </motion.h2>

        <motion.a
          href="#book"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.7 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3 }}
          whileHover={{ opacity: 1 }}
          className="mt-12 inline-block cursor-none text-[11px] uppercase tracking-[0.4em] text-[#E8E0D4] transition-opacity"
        >
          Request a session →
        </motion.a>
      </div>
    </section>
  );
}
