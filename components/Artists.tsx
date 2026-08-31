"use client";
import { artists } from "@/lib/data";
import { motion } from "framer-motion";

export default function Artists() {
  return (
    <section id="artists" data-bg="artists" className="snap-section z-10 w-full px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <p className="mb-3 text-center text-[11px] uppercase tracking-[0.35em] text-rose/80">Artists</p>
        <h2 className="mb-10 text-center font-display text-3xl font-medium text-parchment md:mb-12 md:text-5xl">
          Who holds the machine.
        </h2>
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          {artists.map((artist, i) => (
            <motion.article
              key={artist.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-5 aspect-[3/4] w-full max-w-xs overflow-hidden rounded-sm">
                <img src={artist.image} alt={artist.name} className="h-full w-full object-cover img-cinematic" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <h3 className="font-display text-2xl text-parchment md:text-3xl">{artist.name}</h3>
              <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-brass">{artist.role}</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-parchment/55">{artist.bio}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}