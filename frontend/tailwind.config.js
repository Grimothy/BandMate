/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        'surface-light': '#334155',
        primary: '#22c55e',
        'primary-hover': '#16a34a',
        error: '#ef4444',
        'error-hover': '#dc2626',
        text: '#f8fafc',
        muted: '#94a3b8',
        border: '#334155',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
