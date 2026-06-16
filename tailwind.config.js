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
          950: '#0f1118',
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
        // Rust — semantic danger / unpaid (full scale)
        rust: {
          50: '#faeee9',
          100: '#f4dcd2',
          200: '#e9b9a5',
          300: '#dd9678',
          400: '#cd6f4e',
          500: '#bd5a3a',
          600: '#b3573f',
          700: '#96452f',
          800: '#763726',
          900: '#5e2d20',
        },
        // Emerald — semantic success / paid (full scale)
        emerald2: {
          50: '#e9f3ed',
          100: '#cfe6d8',
          200: '#a3d0b5',
          300: '#6fb389',
          400: '#3f9263',
          500: '#287a4e',
          600: '#1e6b45',
          700: '#185637',
          800: '#14442c',
          900: '#0f3522',
        },
      },
      fontFamily: {
        sans: ['Manrope', '-apple-system', 'system-ui', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        float: 'rgba(19, 21, 28, 0.04) 0 0 0 1px, rgba(19, 21, 28, 0.05) 0 2px 6px 0, rgba(19, 21, 28, 0.12) 0 8px 20px 0',
        glow: '0 0 40px rgba(201, 161, 84, 0.25)',
        'glow-sm': '0 0 0 1px rgba(201,161,84,0.20), 0 6px 18px -6px rgba(201,161,84,0.35)',
        card: 'rgba(19, 21, 28, 0.03) 0 1px 2px 0, rgba(19, 21, 28, 0.05) 0 4px 12px 0',
        'card-lg': 'rgba(19, 21, 28, 0.03) 0 1px 2px 0, rgba(19, 21, 28, 0.06) 0 8px 28px -6px',
        premium: 'rgba(19,21,28,0.04) 0 0 0 1px, rgba(19,21,28,0.06) 0 10px 30px -8px, rgba(201,161,84,0.05) 0 2px 8px 0',
        'inner-top': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      borderRadius: {
        card: '16px',
        '2xl': '1rem',
        '3xl': '1.5rem',
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
        'sweep': {
          '0%': { transform: 'translateX(-120%)' },
          '60%, 100%': { transform: 'translateX(220%)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '60%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.5s ease-out both',
        'scale-in': 'scale-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'drift': 'drift 14s ease-in-out infinite',
        'drift-slow': 'drift 20s ease-in-out infinite reverse',
        'shimmer': 'shimmer 2.5s linear infinite',
        'pop': 'pop 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
