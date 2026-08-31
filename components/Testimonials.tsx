"use client";
import { testimonials } from "@/lib/data";
import { motion } from "framer-motion";

export default function Testimonials() {
  return (
    <section id="words" className="snap-section z-10 w-full px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-rose/80">Words</p>
        <h2 className="mb-12 font-display text-3xl font-medium text-parchment md:text-4xl">
          From people who sat in the chair.
        </h2>
        <div className="grid w-full gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="rounded-sm border border-white/10 bg-charcoal/40 p-6"
            >
              <p className="text-sm leading-relaxed text-parchment/70">“{t.quote}”</p>
              <footer className="mt-5 text-[10px] uppercase tracking-[0.25em] text-parchment/40">
                — {t.name}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}