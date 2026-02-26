/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#070b14',
          panel: '#111827',
          muted: '#1f2937',
          border: '#334155'
        },
        accent: {
          blue: '#38bdf8',
          cyan: '#22d3ee',
          emerald: '#34d399'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(56,189,248,0.25), 0 10px 30px rgba(2,132,199,0.25)'
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)'
      }
    }
  },
  plugins: []
};
