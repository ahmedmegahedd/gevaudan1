import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#061222",
        accent: "#447794",
        mid1: "#2D5B75",
        mid2: "#123249",
      },
    },
  },
  plugins: [],
};
export default config;
