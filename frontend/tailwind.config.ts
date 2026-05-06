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
        primary: "#2A3D2E",
        accent: "#4A5D4D",
        mid1: "#3D4D3F",
        mid2: "#1A2B1D",
        cream: "#EFE6D6",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        script: ["Zapfino", "var(--font-script)", "cursive"],
      },
      letterSpacing: {
        heading: "0.02em",
        label: "0.15em",
      },
      lineHeight: {
        luxe: "1.8",
      },
      boxShadow: {
        card: "0 2px 20px rgba(0,0,0,0.06)",
        "card-hover": "0 6px 30px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        btn: "2px",
        card: "4px",
      },
      transitionDuration: {
        base: "300ms",
        image: "400ms",
      },
    },
  },
  plugins: [],
};
export default config;
