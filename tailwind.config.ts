import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sf: [
          "-apple-system",
          "system-ui",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        ios: {
          bg: "#000000",
          card: "#1c1c1e",
          card2: "#2c2c2e",
          blue: "#0a84ff",
          green: "#30d158",
          red: "#ff453a",
          gray: "#8e8e93",
          separator: "rgba(255,255,255,0.15)",
        },
      },
      borderRadius: {
        phone: "55px",
        screen: "48px",
        appicon: "22.5%", // iOS squircle approximation
      },
      boxShadow: {
        phone: "0 0 0 2px #0a0a0a, 0 0 0 14px #1c1c1e, 0 20px 60px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
