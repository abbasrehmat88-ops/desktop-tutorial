/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rausch — the single brand accent
        primary: {
          50: '#fff5f7',
          100: '#ffe8ed',
          200: '#ffd1da',
          300: '#ff8fa5',
          400: '#ff5c7c',
          500: '#ff385c',
          600: '#ff385c',
          700: '#e00b41',
          800: '#c50d3c',
          900: '#92174d',
        },
        // Airbnb neutral scale: ink, muted, hairlines, soft surfaces
        gray: {
          50: '#f7f7f7',
          100: '#f2f2f2',
          200: '#ebebeb',
          300: '#dddddd',
          400: '#c1c1c1',
          500: '#929292',
          600: '#6a6a6a',
          700: '#3f3f3f',
          800: '#2f2f2f',
          900: '#222222',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Circular', '-apple-system', 'system-ui', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
      },
      boxShadow: {
        // The system's single elevation tier
        float: 'rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0',
      },
      borderRadius: {
        card: '14px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}
