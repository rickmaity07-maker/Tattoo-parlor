"use client";
import { styles } from "@/lib/data";
import { motion } from "framer-motion";

export default function Styles() {
  return (
    <section id="disciplines" data-bg="work" className="snap-section z-10 w-full px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
        <p className="mb-3 text-center text-[11px] uppercase tracking-[0.35em] text-rose/80">Disciplines</p>
        <h2 className="mb-10 text-center font-display text-3xl font-medium text-parchment md:mb-12 md:text-5xl">
          What we do well.
        </h2>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {styles.map((s, i) => (
            <motion.article
              key={s.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="overflow-hidden rounded-sm border border-white/10 bg-charcoal/70 text-center"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={s.image} alt={s.name} className="h-full w-full object-cover img-cinematic" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg text-parchment">{s.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-parchment/50">{s.blurb}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}