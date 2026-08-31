"use client";
import { process } from "@/lib/data";
import { motion } from "framer-motion";

export default function Process() {
  return (
    <section id="process" data-bg="process" className="snap-section z-10 w-full px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <p className="mb-3 text-center text-[11px] uppercase tracking-[0.35em] text-rose/80">Process</p>
        <h2 className="mb-10 text-center font-display text-3xl font-medium text-parchment md:mb-12 md:text-5xl">
          From first message to healed piece.
        </h2>
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {process.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="rounded-sm border border-white/10 bg-charcoal/50 p-6 text-center"
            >
              <span className="font-mono text-xs text-rose">{step.step}</span>
              <h3 className="mt-3 font-display text-xl text-parchment">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-parchment/50">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}