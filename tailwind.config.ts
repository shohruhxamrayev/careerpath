import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        paper: "#F7F6F2",
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
        sans: ['"Inter Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ['"Newsreader Variable"', "ui-serif", "Georgia", "serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "SFMono-Regular", "monospace"],
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
      },
      animation: { "fade-in": "fade-in 220ms ease-out both" },
    },
  },
  plugins: [],
};

export default config;
