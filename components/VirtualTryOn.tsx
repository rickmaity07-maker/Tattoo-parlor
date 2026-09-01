"use client";
import { useState, ChangeEvent } from "react";
import { motion } from "framer-motion";

const flashDesigns = [
  {
    id: "1",
    label: "Blackwork",
    url: "https://images.unsplash.com/photo-1611501271407-f28c242f3609?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "2",
    label: "Fine line",
    url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "3",
    label: "Ornamental",
    url: "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=400&q=80",
  },
];

export default function VirtualTryOn() {
  const [armImage, setArmImage] = useState<string | null>(null);
  const [activeTattoo, setActiveTattoo] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(0.85);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArmImage(URL.createObjectURL(file));
    }
  };

  return (
    <section className="relative z-10 min-h-[100svh] bg-void px-4 pb-16 pt-24 text-parchment sm:px-6 md:px-10 md:pb-24 md:pt-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center">
        <div className="mb-8 max-w-xl text-center md:mb-14">
          <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-rose/80 md:mb-3 md:text-[11px]">
            Virtual studio
          </p>
          <h1 className="font-display text-2xl font-medium tracking-tight text-parchment sm:text-3xl md:text-5xl">
            Place the ink before the appointment.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-parchment/50 md:mt-4 md:text-base">
            Upload a photo. Choose a flash. Drag, scale, and rotate until it sits right.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="order-1 lg:order-2 lg:col-span-2">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-white/10 bg-charcoal/80 sm:aspect-square">
              {armImage ? (
                <img
                  src={armImage}
                  alt="Your photo"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                  <p className="max-w-xs text-[10px] uppercase tracking-[0.25em] text-parchment/30 sm:text-[11px]">
                    Upload a photo of your arm or leg to begin
                  </p>
                </div>
              )}

              {armImage && activeTattoo && (
                <motion.img
                  src={activeTattoo}
                  alt="Tattoo overlay"
                  drag
                  dragMomentum={false}
                  dragConstraints={{ left: -120, right: 120, top: -120, bottom: 120 }}
                  className="absolute z-10 touch-none mix-blend-multiply"
                  style={{
                    scale,
                    rotate: rotation,
                    opacity,
                    top: "30%",
                    left: "28%",
                    width: "40%",
                  }}
                />
              )}
            </div>
            {armImage && activeTattoo && (
              <p className="mt-3 text-center text-[10px] uppercase tracking-[0.25em] text-parchment/35">
                Drag to position · use sliders below
              </p>
            )}
          </div>

          <div className="order-2 flex flex-col gap-6 lg:order-1 lg:col-span-1 lg:gap-8">
            <label className="flex min-h-[52px] cursor-none items-center justify-center gap-3 rounded-sm border border-dashed border-parchment/25 bg-charcoal/40 px-4 py-4 transition active:bg-charcoal/60 sm:py-5">
              <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-parchment/70">
                Upload photo
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-parchment/40">
                Select flash
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {flashDesigns.map((design) => (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => setActiveTattoo(design.url)}
                    className={`min-h-[72px] cursor-none overflow-hidden rounded-sm border transition-all sm:min-h-0 ${
                      activeTattoo === design.url
                        ? "border-parchment/50 opacity-100"
                        : "border-white/5 opacity-50 active:opacity-90"
                    }`}
                  >
                    <div className="aspect-square">
                      <img
                        src={design.url}
                        alt={design.label}
                        className="h-full w-full object-cover img-cinematic grayscale"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5 rounded-sm border border-white/8 bg-charcoal/50 p-4 sm:p-5">
              <div>
                <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.25em] text-parchment/45">
                  <span>Scale</span>
                  <span className="text-brass">{Math.round(scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-rose"
                />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.25em] text-parchment/45">
                  <span>Rotate</span>
                  <span className="text-brass">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseFloat(e.target.value))}
                  className="w-full accent-rose"
                />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.25em] text-parchment/45">
                  <span>Opacity</span>
                  <span className="text-brass">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-rose"
                />
              </div>
              {(armImage || activeTattoo) && (
                <button
                  type="button"
                  onClick={() => {
                    setScale(1);
                    setRotation(0);
                    setOpacity(0.85);
                  }}
                  className="min-h-[44px] w-full cursor-none border border-parchment/15 py-2.5 text-[10px] uppercase tracking-[0.25em] text-parchment/50 transition active:border-parchment/30"
                >
                  Reset transform
                </button>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-parchment/35">
              Digital preview only — not a final stencil.
            </p>

            <a
              href="/#reserve"
              className="flex min-h-[48px] cursor-none items-center justify-center rounded-full bg-parchment py-3.5 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-void transition active:bg-white"
            >
              Reserve a session
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}