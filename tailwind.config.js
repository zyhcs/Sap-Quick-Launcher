/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0D0D12',
          card: '#1A1A24',
          'card-hover': '#222230',
          field: '#14141C',
        },
        primary: {
          DEFAULT: '#00D4FF',
          dim: 'rgba(0, 212, 255, 0.1)',
        },
        accent: {
          red: '#EF4444',
          yellow: '#EAB308',
          green: '#22C55E',
          purple: '#A855F7',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
