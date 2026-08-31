import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#050504",
          soft: "#0C0B0A",
        },
        charcoal: {
          DEFAULT: "#141311",
          lift: "#1C1B19",
        },
        parchment: {
          DEFAULT: "#EDE6D9",
          dim: "#C9C0B0",
          mute: "#9A9285",
        },
        rose: {
          DEFAULT: "#8B2E3A",
          bright: "#A63D4A",
          deep: "#5C1E27",
        },
        brass: {
          DEFAULT: "#C4A574",
          dim: "#8F7A55",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mark: ["var(--font-mark)", "serif"],
        script: ["var(--font-script)", "cursive"],
      },
      letterSpacing: {
        widest2: "0.35em",
        cinematic: "0.28em",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        flicker: {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
        slowZoom: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        flicker: "flicker 5s ease-in-out infinite",
        "slow-zoom": "slowZoom 28s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
export default config;
