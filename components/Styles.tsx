"use client";
import { styles } from "@/lib/data";
import { motion } from "framer-motion";

export default function Styles() {
  return (
    <section id="disciplines" data-bg="work" className="snap-section z-10 w-full px-6 md:px-10 lg:px-14">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col justify-center py-16 md:py-20">
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-rose/80">Disciplines</p>
          <h2 className="font-display text-3xl font-medium text-parchment md:text-5xl">
            What we do well.
          </h2>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {styles.map((s, i) => (
            <motion.article
              key={s.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="overflow-hidden rounded-sm border border-white/10 bg-charcoal/70 text-center"
            >
              <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/4]">
                <img src={s.image} alt={s.name} className="h-full w-full object-cover img-cinematic" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-left md:p-5">
                  <h3 className="font-display text-xl text-parchment md:text-2xl">{s.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-parchment/55 md:text-sm">{s.blurb}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}