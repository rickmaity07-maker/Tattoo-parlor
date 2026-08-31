"use client";
import { motion } from "framer-motion";
import { gallery } from "@/lib/data";

export default function PortfolioGallery() {
  const items = gallery.slice(0, 6);

  return (
    <section id="work" data-bg="work" className="snap-section z-10 w-full px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <p className="mb-3 text-center text-[11px] uppercase tracking-[0.35em] text-rose/80">Work</p>
        <h2 className="mb-8 text-center font-display text-3xl font-medium text-parchment md:mb-10 md:text-5xl">
          Recent pieces
        </h2>
        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {items.map((item, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05 }}
              className="overflow-hidden rounded-sm"
            >
              <div className="aspect-square overflow-hidden">
                <img src={item.image} alt={item.caption} className="h-full w-full object-cover img-cinematic" />
              </div>
              <figcaption className="mt-2 text-center text-[10px] text-parchment/45 md:text-xs">
                {item.caption}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}