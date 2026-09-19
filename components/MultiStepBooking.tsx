"use client";
import { useState, FormEvent } from "react";
import { motion } from "framer-motion";

type Status = "idle" | "submitting" | "success" | "error";

export default function MultiStepBooking() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      preferredArtist: data.get("preferredArtist"),
      idea: data.get("idea"),
      company: data.get("company"), // honeypot
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Couldn't reach the server. Please check your connection and try again.");
    }
  };

  return (
    <section id="reserve" data-bg="cta" className="snap-section z-10 w-full px-4 sm:px-6 md:px-10 lg:px-14">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full overflow-hidden rounded-sm border border-parchment/25 bg-parchment text-void shadow-[0_0_60px_rgba(237,230,217,0.1)]"
        >
          <div className="grid md:grid-cols-5">
            <div className="flex flex-col justify-center border-b border-void/10 p-6 text-center sm:p-8 md:col-span-2 md:border-b-0 md:border-r md:p-10 md:text-left lg:p-12">
              <p className="text-[11px] uppercase tracking-[0.3em] text-rose">Reserve</p>
              <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Book the chair.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-void/65 md:mt-4 md:text-base">
                We’ll match you to the right artist and reply within two business days.
              </p>
              <ul className="mt-5 hidden space-y-2 text-sm text-void/60 sm:block">
                <li>01 · Consultation before deposit</li>
                <li>02 · Design sent ahead of session</li>
                <li>03 · Touch-up included (12 months)</li>
              </ul>
            </div>

            {status === "success" ? (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center sm:p-8 md:col-span-3 md:p-10 lg:p-12">
                <p className="text-[11px] uppercase tracking-[0.3em] text-rose">Request sent</p>
                <h3 className="font-display text-xl font-medium tracking-tight sm:text-2xl">
                  We’ve got it.
                </h3>
                <p className="max-w-sm text-sm leading-relaxed text-void/65">
                  Thanks for reaching out — we’ll reply within two business days with availability and next steps.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-2 text-[11px] font-medium uppercase tracking-[0.25em] text-void/50 underline decoration-void/30 underline-offset-4 hover:text-void"
                >
                  Send another request
                </button>
              </div>
            ) : (
              <form
                className="space-y-4 p-6 sm:space-y-5 sm:p-8 md:col-span-3 md:p-10 lg:p-12"
                onSubmit={onSubmit}
              >
                {/* Honeypot — hidden from real visitors, bots tend to fill every field */}
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-widest text-void/40">Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      maxLength={100}
                      className="min-h-[44px] w-full border-b border-void/20 bg-transparent py-2.5 text-base outline-none focus:border-rose"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-widest text-void/40">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      maxLength={200}
                      className="min-h-[44px] w-full border-b border-void/20 bg-transparent py-2.5 text-base outline-none focus:border-rose"
                      placeholder="you@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest text-void/40">Preferred artist</label>
                  <select
                    name="preferredArtist"
                    defaultValue=""
                    className="min-h-[44px] w-full border-b border-void/20 bg-transparent py-2.5 text-base outline-none focus:border-rose"
                  >
                    <option value="">No preference</option>
                    <option>Cole Marrow — Blackwork & Script</option>
                    <option>Rae Osei — Fine Line & Ornamental</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest text-void/40">The idea</label>
                  <textarea
                    name="idea"
                    rows={3}
                    required
                    maxLength={2000}
                    className="w-full resize-none border-b border-void/20 bg-transparent py-2.5 text-base outline-none focus:border-rose"
                    placeholder="Placement, size, style…"
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-600">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="min-h-[48px] w-full rounded-full bg-void py-3.5 text-[11px] font-medium uppercase tracking-[0.25em] text-parchment transition active:bg-void/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting" ? "Sending…" : "Send reservation request"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
