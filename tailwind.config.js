/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1E3A5F',
          dark: '#0F172A',
          blue: '#2563EB',
        },
        status: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
        },
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
