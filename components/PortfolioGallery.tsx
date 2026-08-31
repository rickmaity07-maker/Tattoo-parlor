"use client";
import { motion } from "framer-motion";
import { gallery } from "@/lib/data";

export default function PortfolioGallery() {
  const items = gallery.slice(0, 6);

  return (
    <section
      id="work"
      data-bg="work"
      className="snap-section z-10 w-full px-6 md:px-10 lg:px-14"
      data-allow-scroll
    >
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center pb-16 pt-28 md:pb-20 md:pt-32">
        <div className="mb-6 shrink-0 text-center md:mb-8">
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-rose/80">Work</p>
          <h2 className="font-display text-3xl font-medium text-parchment md:text-4xl lg:text-5xl">
            Recent pieces
          </h2>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {items.map((item, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className="overflow-hidden rounded-sm"
            >
              <div className="aspect-[4/3] overflow-hidden md:aspect-square">
                <img
                  src={item.image}
                  alt={item.caption}
                  className="h-full w-full object-cover img-cinematic"
                />
              </div>
              <figcaption className="mt-1.5 truncate text-center text-[10px] text-parchment/45 md:text-xs">
                {item.caption}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}