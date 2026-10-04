import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Tokens semánticos del tema oscuro: cambiar aquí cambia toda la app
      colors: {
        accent: { DEFAULT: "#22d3ee", strong: "#06b6d4" },
        income: "#34d399",
        expense: "#fb7185",
        surface: { DEFAULT: "#0f172a", raised: "#1e293b" },
      },
      keyframes: {
        "sheet-up": {
          from: { transform: "translateY(24px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "sheet-up": "sheet-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
