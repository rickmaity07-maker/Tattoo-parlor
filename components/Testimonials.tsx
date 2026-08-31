"use client";
import { testimonials } from "@/lib/data";
import { motion } from "framer-motion";

export default function Testimonials() {
  return (
    <section id="words" className="snap-section z-10 w-full px-6 md:px-10 lg:px-14">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center py-16 md:py-20">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-rose/80">Words</p>
          <h2 className="font-display text-3xl font-medium text-parchment md:text-5xl">
            From people who sat in the chair.
          </h2>
        </div>
        <div className="grid w-full gap-6 md:grid-cols-3 md:gap-8">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="rounded-sm border border-white/10 bg-charcoal/40 p-8 text-center md:p-10"
            >
              <p className="text-base leading-relaxed text-parchment/75 md:text-lg">“{t.quote}”</p>
              <footer className="mt-6 text-[11px] uppercase tracking-[0.25em] text-parchment/40">
                — {t.name}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}