"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faqs } from "@/lib/data";

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="snap-section z-10 w-full px-6 md:px-10" data-allow-scroll>
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-center py-16 md:py-20">
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-rose/80">FAQ</p>
          <h2 className="font-display text-3xl font-medium text-parchment md:text-5xl">
            Before you write.
          </h2>
        </div>
        <div className="w-full border-t border-parchment/10">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-parchment/10">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full cursor-none items-center justify-between py-5 text-left"
              >
                <span className="font-display text-lg text-parchment md:text-xl">{faq.q}</span>
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
                    <p className="pb-5 text-sm leading-relaxed text-parchment/50 md:text-base">
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