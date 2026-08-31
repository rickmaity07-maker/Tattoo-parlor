export default function Grain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9997] opacity-[0.055] mix-blend-overlay"
      aria-hidden
    >
      <svg className="h-full w-full">
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
}
