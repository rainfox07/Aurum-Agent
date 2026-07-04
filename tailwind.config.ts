import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#faf9f9",
        surface: "#faf9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f4f3f3",
        "surface-container": "#efeeed",
        "surface-container-high": "#e9e8e8",
        "surface-container-highest": "#e3e2e2",
        "on-surface": "#1a1c1c",
        secondary: "#5f5e5e",
        outline: "#8f706b",
        "outline-variant": "#e3beb9",
        primary: "#b41f17",
        "primary-container": "#d7392d",
        error: "#ba1a1a"
      },
      spacing: {
        gutter: "24px",
        margin: "32px",
        "sidebar-width": "280px",
        "main-content-max-width": "800px"
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px"
      },
      fontFamily: {
        serif: ["var(--font-serif)", "SimSun", "STSong", "serif"],
        sans: ["var(--font-sans)", "Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

