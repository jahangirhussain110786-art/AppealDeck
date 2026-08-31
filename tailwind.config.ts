import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0b0e14",
        panel: "#121722",
        edge: "#1f2733",
        accent: "#6ee7b7",
      },
    },
  },
  plugins: [],
};

export default config;
