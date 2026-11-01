import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        night: {
          950: "#04060A",
          900: "#070A10",
          850: "#0A0E15",
          800: "#0E131C",
          700: "#151C28",
          600: "#1E2735",
          500: "#2A3546",
          400: "#4A566A",
          300: "#8B96A9",
          200: "#B9C2D2",
          100: "#E2E7EF",
        },
        mint: { DEFAULT: "#5EEAB0", 300: "#93F3CB", 600: "#22B987", 900: "#0B3B2C" },
        peri: { DEFAULT: "#8EA8FF", 600: "#5B78E6" },
        sun: "#FFD27A",
        paper: "#F6F6F3",
        surface: "#FFFFFF",
        line: { DEFAULT: "#E4E1D8", strong: "#CFCABD" },
        ink: { DEFAULT: "#111A2B", 2: "#364154", 3: "#5E6573", 4: "#8A8F99" },
        brand: {
          50: "#EEF4F1",
          100: "#D7E6DF",
          200: "#AFCBBF",
          500: "#2F6B5B",
          600: "#225548",
          700: "#1B463B",
          800: "#15362E",
          900: "#0F2722",
        },
        ok: { DEFAULT: "#1D6A44", bg: "#E8F3EC" },
        warn: { DEFAULT: "#94570A", bg: "#FBF1E0" },
        bad: { DEFAULT: "#A23129", bg: "#FBEDEB" },
        info: { DEFAULT: "#2A4F86", bg: "#EBF0F8" },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque Variable"', "var(--font-geist-sans)", "ui-sans-serif", "sans-serif"],
        serif: ['"Instrument Serif"', "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: { DEFAULT: "6px", md: "8px", lg: "10px", xl: "12px" },
      boxShadow: {
        card: "0 1px 0 rgba(17,26,43,0.04), 0 1px 2px rgba(17,26,43,0.04)",
        lift: "0 1px 0 rgba(17,26,43,0.04), 0 8px 24px -8px rgba(17,26,43,0.14)",
        pop: "0 12px 40px -12px rgba(17,26,43,0.28)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "glow-pulse": { "0%,100%": { opacity: "0.55" }, "50%": { opacity: "1" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: {
        "fade-in": "fade-in 220ms ease-out both",
        marquee: "marquee 60s linear infinite",
        "glow-pulse": "glow-pulse 3.2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
