"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faqs } from "@/lib/data";

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="snap-section z-10 w-full px-6" data-allow-scroll>
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <p className="mb-3 text-center text-[11px] uppercase tracking-[0.35em] text-rose/80">FAQ</p>
        <h2 className="mb-8 text-center font-display text-3xl font-medium text-parchment md:text-4xl">
          Before you write.
        </h2>
        <div className="w-full border-t border-parchment/10">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-parchment/10">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full cursor-none items-center justify-between py-4 text-left"
              >
                <span className="font-display text-base text-parchment md:text-lg">{faq.q}</span>
                <span className="ml-4 text-parchment/40">{open === i ? "−" : "+"}</span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 text-center text-sm leading-relaxed text-parchment/50 md:text-left">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}