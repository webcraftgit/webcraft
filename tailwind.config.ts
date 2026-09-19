import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#05080F",
        "bg-soft": "#0C1424",
        ink: "#E8F1FA",
        "ink-soft": "#8FA3BF",
        brand: {
          300: "#A5F3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          700: "#075985",
        },
        "accent-green": "#34D399",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        input: "12px",
        card: "20px",
        panel: "28px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
