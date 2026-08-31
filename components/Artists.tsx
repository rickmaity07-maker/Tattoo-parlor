"use client";
import { artists } from "@/lib/data";
import { motion } from "framer-motion";

export default function Artists() {
  return (
    <section id="artists" data-bg="artists" className="snap-section z-10 w-full px-6 md:px-12 lg:px-16">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center py-20 md:py-24">
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-rose/80">Artists</p>
          <h2 className="font-display text-3xl font-medium text-parchment md:text-5xl">
            Who holds the machine.
          </h2>
        </div>

        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
          {artists.map((artist, i) => (
            <motion.article
              key={artist.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-5 aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-sm sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px]">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="h-full w-full object-cover img-cinematic"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
              <h3 className="font-display text-2xl text-parchment md:text-3xl lg:text-4xl">
                {artist.name}
              </h3>
              <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-brass md:text-[11px]">
                {artist.role}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-parchment/55 md:max-w-md md:text-base">
                {artist.bio}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}