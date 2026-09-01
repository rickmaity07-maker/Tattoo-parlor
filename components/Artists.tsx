"use client";
import { artists } from "@/lib/data";
import { motion } from "framer-motion";

export default function Artists() {
  return (
    <section
      id="artists"
      data-bg="artists"
      className="snap-section z-10 w-full px-4 sm:px-6 md:px-10 lg:px-14"
      data-allow-scroll
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center py-6 md:py-8">
        <div className="mb-4 shrink-0 text-center md:mb-5">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.35em] text-rose/80 md:text-[11px]">Artists</p>
          <h2 className="font-display text-2xl font-medium text-parchment sm:text-3xl md:text-4xl">
            Who holds the machine.
          </h2>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 sm:gap-6 md:grid-cols-2 md:gap-10 lg:gap-14">
          {artists.map((artist, i) => (
            <motion.article
              key={artist.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-3 h-[20vh] max-h-[200px] w-full max-w-[160px] overflow-hidden rounded-sm sm:max-w-[180px] md:h-[26vh] md:max-h-[260px] md:max-w-[240px]">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="h-full w-full object-cover object-top img-cinematic"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <h3 className="font-display text-xl text-parchment md:text-2xl lg:text-3xl">
                {artist.name}
              </h3>
              <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-brass sm:text-[10px]">
                {artist.role}
              </p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-parchment/55 sm:text-sm">
                {artist.bio}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}