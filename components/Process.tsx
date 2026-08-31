"use client";
import { process } from "@/lib/data";
import { motion } from "framer-motion";

export default function Process() {
  return (
    <section id="process" data-bg="process" className="snap-section z-10 w-full px-6 md:px-10 lg:px-14">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center py-16 md:py-20">
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-rose/80">Process</p>
          <h2 className="font-display text-3xl font-medium text-parchment md:text-5xl">
            From first message to healed piece.
          </h2>
        </div>
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {process.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="rounded-sm border border-white/10 bg-charcoal/50 p-6 text-center md:p-8"
            >
              <span className="font-mono text-xs text-rose">{step.step}</span>
              <h3 className="mt-3 font-display text-xl text-parchment md:text-2xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-parchment/50 md:text-base">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}