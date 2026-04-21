/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#f5f4ed",
        "near-black": "#141413",
        terracotta: "#c96442",
        ivory: "#faf9f5",
        "olive-gray": "#5e5d59",
        "stone-gray": "#87867f",
        "border-cream": "#f0eee6",
        "dark-surface": "#30302e",
        "warm-sand": "#e8e6dc",
        "charcoal-warm": "#4d4c48",
        "warm-silver": "#b0aea5",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        ring: "0 0 0 1px",
        whisper: "0 4px 24px rgba(0,0,0,0.05)",
      },
      borderRadius: {
        'comfort': '8px',
        'generous': '12px',
        'featured': '16px',
        'hero': '32px',
      },
      lineHeight: {
        'tight-hero': '1.10',
        'editorial': '1.60',
      }
    },
  },
  plugins: [],
}
