/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Champagne gold — the brand accent
        primary: {
          50: '#faf6ec',
          100: '#f3ead2',
          200: '#e7d5a4',
          300: '#dcc07b',
          400: '#d2ae5e',
          500: '#c9a154',
          600: '#b08940',
          700: '#8f6d31',
          800: '#6f5426',
          900: '#57411e',
        },
        // Deep charcoal — the luxury dark surface
        charcoal: {
          50: '#f4f4f6',
          100: '#e9e9ee',
          200: '#d2d3dc',
          300: '#a7a9b8',
          400: '#7c7f93',
          500: '#565a6e',
          600: '#3a3d4f',
          700: '#262934',
          800: '#1b1d26',
          900: '#13151c',
        },
        // Warm neutral scale for light surfaces
        gray: {
          50: '#faf9f6',
          100: '#f2f1ec',
          200: '#e7e5dd',
          300: '#d8d5ca',
          400: '#b3b0a4',
          500: '#8d8a7f',
          600: '#6c6960',
          700: '#4d4b44',
          800: '#33312c',
          900: '#1f1e1a',
        },
        cream: '#faf8f3',
        rust: {
          50: '#faeee9',
          100: '#f4dcd2',
          600: '#b3573f',
          700: '#96452f',
        },
        emerald2: {
          50: '#e9f3ed',
          600: '#1e6b45',
        },
      },
      fontFamily: {
        sans: ['Manrope', '-apple-system', 'system-ui', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        float: 'rgba(19, 21, 28, 0.04) 0 0 0 1px, rgba(19, 21, 28, 0.05) 0 2px 6px 0, rgba(19, 21, 28, 0.12) 0 8px 20px 0',
        glow: '0 0 40px rgba(201, 161, 84, 0.25)',
        card: 'rgba(19, 21, 28, 0.03) 0 1px 2px 0, rgba(19, 21, 28, 0.05) 0 4px 12px 0',
      },
      borderRadius: {
        card: '16px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-30px, 25px) scale(0.95)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.5s ease-out both',
        'scale-in': 'scale-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'drift': 'drift 14s ease-in-out infinite',
        'drift-slow': 'drift 20s ease-in-out infinite reverse',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}
