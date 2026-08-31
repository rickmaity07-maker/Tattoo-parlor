"use client";
import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="studio" data-bg="about" className="snap-section z-10 w-full px-6 md:px-12">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center text-center py-20">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-4 text-[11px] uppercase tracking-[0.35em] text-rose/80"
        >
          Studio
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="font-display text-4xl font-medium tracking-tight text-parchment md:text-6xl"
        >
          A quiet room for permanent work.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="mt-8 max-w-2xl text-base leading-relaxed text-parchment/60 md:text-xl"
        >
          Consultations are unhurried. Designs follow your anatomy — size, movement, and how the piece will age — before any ink hits skin.
        </motion.p>
        <motion.ul
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 flex flex-col gap-4 text-sm text-parchment/50 md:flex-row md:gap-10 md:text-base"
        >
          <li>Private stations · appointment only</li>
          <li>Sterile protocol · single-use supplies</li>
          <li>Design review before every session</li>
        </motion.ul>
      </div>
    </section>
  );
}