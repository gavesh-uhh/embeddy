import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg: "#0d1117",
        surface: "#161b22",
        "surface-raised": "#21262d",
        border: "#30363d",
        "text-primary": "#e6edf3",
        "text-muted": "#7d8590",
        "accent-blue": "#2f81f4",
        "accent-orange": "#f97316",
        "accent-green": "#3fb950",
        "accent-red": "#f85149",
        "accent-purple": "#a855f7",
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      boxShadow: {
        panel: "0 1px 3px rgba(0,0,0,0.4)",
      },
      letterSpacing: {
        widest2: "0.08em",
      },
    },
  },
  plugins: [],
};
export default config;
