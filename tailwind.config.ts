import type { Config } from "tailwindcss";

/* Design system adapted from Nodea: acid-on-void, mono-first, editorial. */
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        acid: "#cdff00",
        void: {
          500: "#333333",
          600: "#262626",
          700: "#1c1c1c",
          800: "#141414",
          850: "#0f0f0f",
          950: "#050505",
        },
        buyer: "#38bdf8",
        seller: "#a78bfa",
        locked: "#f59e0b",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        label: ".18em",
      },
    },
  },
  plugins: [],
};

export default config;
