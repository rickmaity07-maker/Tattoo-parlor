"use client";
import { motion } from "framer-motion";
import { gallery } from "@/lib/data";

export default function PortfolioGallery() {
  const items = gallery.slice(0, 6);

  return (
    <section id="work" data-bg="work" className="snap-section z-10 w-full px-6 md:px-10 lg:px-14">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center py-16 md:py-20">
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-rose/80">Work</p>
          <h2 className="font-display text-3xl font-medium text-parchment md:text-5xl">
            Recent pieces
          </h2>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:gap-5">
          {items.map((item, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.04 }}
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