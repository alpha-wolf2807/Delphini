/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        delphini: {
          cyan: "#00f2fe",
          blue: "#4facfe",
          glow: "#00e5ff",
          dark: "#05070c",
          card: "#0b0f19",
          border: "#162032",
          surface: "#0d1527",
          neon: "#00ffff",
          accent: "#38bdf8",
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 242, 254, 0.4)',
        'glow-sm': '0 0 10px -2px rgba(0, 242, 254, 0.3)',
        'glow-strong': '0 0 35px 2px rgba(0, 242, 254, 0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
