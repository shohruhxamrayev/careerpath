import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        night: {
          950: "#0C1424",
          900: "#111A2C",
          850: "#152034",
          800: "#1A263C",
          700: "#223049",
          600: "#2D3B56",
          500: "#3D4B66",
          400: "#66728A",
          300: "#A0AABD",
          200: "#C8CFDB",
          100: "#E6EAF1",
        },
        mint: { DEFAULT: "#8CCFB4", 300: "#B6E2CF", 600: "#4E9C80", 900: "#163A2F" },
        peri: { DEFAULT: "#A7B4DA", 600: "#6F80B8" },
        sun: "#E6C88E",
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
