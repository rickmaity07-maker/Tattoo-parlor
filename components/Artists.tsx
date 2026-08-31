"use client";
import { artists } from "@/lib/data";
import { motion } from "framer-motion";

export default function Artists() {
  return (
    <section
      id="artists"
      data-bg="artists"
      className="snap-section z-10 w-full px-6 md:px-10 lg:px-14"
      data-allow-scroll
    >
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center py-24 md:py-28">
        <div className="mb-6 shrink-0 text-center md:mb-8">
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-rose/80">Artists</p>
          <h2 className="font-display text-3xl font-medium text-parchment md:text-4xl lg:text-5xl">
            Who holds the machine.
          </h2>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          {artists.map((artist, i) => (
            <motion.article
              key={artist.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-4 h-[28vh] max-h-[260px] w-full max-w-[220px] overflow-hidden rounded-sm sm:max-w-[240px] md:h-[32vh] md:max-h-[300px] md:max-w-[280px]">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="h-full w-full object-cover object-top img-cinematic"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <h3 className="font-display text-2xl text-parchment md:text-3xl">
                {artist.name}
              </h3>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.28em] text-brass">
                {artist.role}
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-parchment/55 md:max-w-sm">
                {artist.bio}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}