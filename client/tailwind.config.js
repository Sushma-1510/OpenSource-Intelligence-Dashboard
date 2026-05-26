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
        background: {
          light: '#f8fafc',
          dark: '#080c14',
        },
        card: {
          light: '#ffffff',
          dark: '#111827',
        },
        border: {
          light: '#e2e8f0',
          dark: '#1f2937',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
