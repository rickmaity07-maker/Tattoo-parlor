"use client";
import { motion } from "framer-motion";
import { gallery } from "@/lib/data";

export default function PortfolioGallery() {
  const items = gallery.slice(0, 6);

  return (
    <section
      id="work"
      data-bg="work"
      className="snap-section z-10 w-full px-4 sm:px-6 md:px-10 lg:px-14"
      data-allow-scroll
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center py-6 md:py-8">
        <div className="mb-4 shrink-0 text-center md:mb-5">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.35em] text-rose/80 md:text-[11px]">Work</p>
          <h2 className="font-display text-2xl font-medium text-parchment sm:text-3xl md:text-4xl">
            Recent pieces
          </h2>
        </div>

        <div className="grid min-h-0 w-full grid-cols-2 content-center gap-2 sm:gap-2.5 md:grid-cols-3 md:gap-3">
          {items.map((item, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.03 }}
              className="overflow-hidden rounded-sm"
            >
              <div className="aspect-[4/3] max-h-[22vh] overflow-hidden sm:max-h-[26vh] md:aspect-square md:max-h-[32vh]">
                <img
                  src={item.image}
                  alt={item.caption}
                  className="h-full w-full object-cover img-cinematic"
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-1 truncate text-center text-[9px] text-parchment/45 sm:text-[10px]">
                {item.caption}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}