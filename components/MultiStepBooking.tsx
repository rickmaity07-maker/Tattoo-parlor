"use client";
import { motion } from "framer-motion";

export default function MultiStepBooking() {
  return (
    <section id="reserve" data-bg="cta" className="snap-section z-10 w-full px-6 md:px-10 lg:px-14">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full overflow-hidden rounded-sm border border-parchment/25 bg-parchment text-void shadow-[0_0_60px_rgba(237,230,217,0.1)]"
        >
          <div className="grid md:grid-cols-5">
            <div className="flex flex-col justify-center border-b border-void/10 p-8 text-center md:col-span-2 md:border-b-0 md:border-r md:p-10 md:text-left lg:p-12">
              <p className="text-[11px] uppercase tracking-[0.3em] text-rose">Reserve</p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl">
                Book the chair.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-void/65 md:text-base">
                We’ll match you to the right artist and reply within two business days.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-void/60">
                <li>01 · Consultation before deposit</li>
                <li>02 · Design sent ahead of session</li>
                <li>03 · Touch-up included (12 months)</li>
              </ul>
            </div>

            <form
              className="space-y-5 p-8 md:col-span-3 md:p-10 lg:p-12"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest text-void/40">Name</label>
                  <input type="text" required className="w-full border-b border-void/20 bg-transparent py-2 text-base outline-none focus:border-rose cursor-none" placeholder="Full name" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest text-void/40">Email</label>
                  <input type="email" required className="w-full border-b border-void/20 bg-transparent py-2 text-base outline-none focus:border-rose cursor-none" placeholder="you@email.com" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-void/40">Preferred artist</label>
                <select className="w-full border-b border-void/20 bg-transparent py-2 text-base outline-none focus:border-rose cursor-none">
                  <option value="">No preference</option>
                  <option>Cole Marrow — Blackwork & Script</option>
                  <option>Rae Osei — Fine Line & Ornamental</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-void/40">The idea</label>
                <textarea rows={3} required className="w-full resize-none border-b border-void/20 bg-transparent py-2 text-base outline-none focus:border-rose cursor-none" placeholder="Placement, size, style…" />
              </div>
              <button type="submit" className="w-full cursor-none rounded-full bg-void py-3.5 text-[11px] font-medium uppercase tracking-[0.25em] text-parchment transition hover:bg-void/90">
                Send reservation request
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}