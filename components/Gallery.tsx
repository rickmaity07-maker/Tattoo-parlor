"use client";
import { IMG } from "@/lib/data";
import { motion } from "framer-motion";

const shots = [IMG.handsClose, IMG.monoProcess, IMG.studioDark, IMG.blackworkDetail, IMG.floralNeck];

export default function Gallery() {
  return (
    <section className="relative z-10 py-12 md:py-20">
      {/* Continuous horizontal film strip — no labels */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-2 md:gap-3 md:px-6">
        {shots.map((src, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10px" }}
            transition={{ duration: 1.1, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative min-w-[78vw] flex-shrink-0 overflow-hidden md:min-w-[42vw] lg:min-w-[32vw]"
          >
            <div className="aspect-[16/10] w-full">
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover img-cinematic transition-transform duration-[1.4s] hover:scale-[1.04]"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
