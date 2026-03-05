/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          dark: '#16a34a',
        },
        accent: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        dark: {
          base: '#000000',
          card: '#0a0f25',
          border: 'rgba(255,255,255,0.08)',
          muted: '#0f172a',
        },
        step: {
          pending: '#475569',
          active: '#4ade80',
          done: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.08)',
      },
      keyframes: {
        fadeSlideIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.75)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-slide': 'fadeSlideIn 0.4s ease forwards',
        'pulse-dot': 'pulseDot 1.2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
      backdropBlur: { xl: '14px' },
    },
  },
  plugins: [],
};
