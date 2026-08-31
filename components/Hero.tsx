"use client";
import { motion } from "framer-motion";
import { IMG } from "@/lib/data";

export default function Hero() {
  return (
    <section
      id="hero"
      data-bg="hero"
      className="snap-section relative z-10 w-full"
    >
      <div className="absolute inset-0 z-0">
        <img src={IMG.hero} alt="" className="h-full w-full object-cover img-cinematic" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="mb-5 text-[11px] uppercase tracking-[0.4em] text-parchment/50"
        >
          Custom tattoo · Appointment only
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(3rem,12vw,7.5rem)] font-medium leading-[0.9] tracking-tight text-parchment"
        >
          Iron Rose
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9, duration: 1 }}
          className="mt-6 max-w-md text-sm leading-relaxed text-parchment/55 md:text-base"
        >
          Blackwork, fine line, and ornamental work built around your body.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.7 }}
          onClick={() => document.getElementById("reserve")?.scrollIntoView({ behavior: "smooth" })}
          className="mt-10 cursor-none rounded-full bg-parchment px-8 py-3.5 text-[11px] font-medium uppercase tracking-[0.25em] text-void transition hover:bg-white"
        >
          Reserve a session
        </motion.button>
      </div>
    </section>
  );
}